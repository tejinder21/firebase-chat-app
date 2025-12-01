**Chat-sovellus – README**

Tämä projekti on yksinkertainen chat-sovellus, jonka tein mobiiliohjelmoinnin kurssin lopputyöksi. Sovelluksella voi luoda käyttäjätunnuksen, kirjautua sisään ja jutella muiden käyttäjien kanssa. Käytin React Nativea ja Firebasea, koska ne sopivat hyvin mobiilisovelluksen rakentamiseen ja reaaliaikaisen datan käsittelyyn.


**Käytetyt teknologiat ja mitä ne tekevät**

**React Native**

Sovelluksen koko käyttöliittymä on tehty React Nativella. Se mahdollistaa sen, että voin tehdä mobiilisovelluksen JavaScriptillä, eikä tarvitse koodata erikseen Androidille ja iOS:lle.

**Expo**

Käytin Expoa projektin alustana. Expo tekee kehittämisestä helpompaa, koska sillä voi testata sovellusta nopeasti omalla puhelimella ja se hoitaa paljon taustalla olevia asetuksia puolestani.

**Expo Router**

Tällä toteutin sivujen välisen siirtymisen. Esimerkiksi kirjautumisesta etusivulle ja etusivulta chattiin. Routerin avulla navigointi pysyy selkeänä.

**Firebase Authentication**

Tällä toteutin:

- rekisteröitymisen

- kirjautumisen

- uloskirjautumisen

Käyttäjät tunnistetaan sähköpostin ja salasanan avulla.

**Cloud Firestore**

Firestoreen tallentuu:

chat-viestit

käyttäjätiedot

online/last seen -tiedot

viimeisimmät keskustelut

Firestore päivittää tietoa reaaliajassa, joten viestit näkyvät heti toiselle käyttäjälle.

**React Native Paper**

Tämä kirjasto auttoi tekemään käyttöliittymästä siistin ja selkeän. Käytin sitä esimerkiksi:

painikkeisiin

tekstikenttiin

listakomponentteihin

profiilin avatar-kuvakkeeseen

**Pieni REST API -haku (slash-komennot)**

Lisäsin chattiin pienen lisätoiminnon. Kun kirjoittaa esim. /cat, sovellus hakee hauskan faktan ulkoisesta rajapinnasta (catfact.ninja) ja lähettää sen viestinä. Tämä tuo sovellukseen vähän lisää hauskuutta.

**Online / viimeksi nähty**

Sovellus tallentaa Firestoreen, milloin käyttäjä on paikalla ja milloin hän poistuu. Tämä näkyy keskusteluissa.
