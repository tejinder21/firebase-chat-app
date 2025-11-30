// components/ProfileAvatar.js
import * as ImagePicker from 'expo-image-picker';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import { View } from 'react-native';
import { Avatar, IconButton } from 'react-native-paper';
import { auth, db, storage } from '../firebaseConfig';

export default function ProfileAvatar({ user }) {
  const initial = (
    user?.displayName?.trim()?.charAt(0) ??
    user?.email?.trim()?.charAt(0) ??
    'U'
  ).toUpperCase();

  const [photo, setPhoto] = useState(user?.photoURL || null);
  const [uploading, setUploading] = useState(false);

  const pickAndUploadImage = async () => {
    if (!auth.currentUser) return;

    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('We need permission to access your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;

    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const imageRef = ref(
        storage,
        `profileImages/${auth.currentUser.uid}.jpg`
      );
      await uploadBytes(imageRef, blob);

      const downloadUrl = await getDownloadURL(imageRef);

      await updateProfile(auth.currentUser, { photoURL: downloadUrl });

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        photoURL: downloadUrl,
      });

      setPhoto(downloadUrl);
    } catch (e) {
      console.warn('Image upload failed:', e);
      alert('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ alignItems: 'center' }}>
      {photo ? (
        <Avatar.Image size={150} source={{ uri: photo }} />
      ) : (
        <Avatar.Text
          size={150}
          label={initial}
          style={{ backgroundColor: '#180fc4ff' }}
        />
      )}

      <IconButton
        icon="camera"
        size={24}
        onPress={pickAndUploadImage}
        disabled={uploading}
        style={{ marginTop: 8 }}
      />
    </View>
  );
}
