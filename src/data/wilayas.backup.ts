export interface Commune {
  name: string;
  extra: number;
}

export interface Wilaya {
  code: number;
  name: string;
  home: number;
  stopdesk: number;
  communes: Commune[];
}

const c = (name: string, extra = 0): Commune => ({ name, extra });

export const wilayas: Wilaya[] = [
  { code: 1, name: 'Adrar', home: 1100, stopdesk: 850, communes: [c('Adrar'), c('Reggane', 250), c('Aoulef', 200), c('Zaouiet Kounta', 200), c('Tsabit', 150)] },
  { code: 2, name: 'Chlef', home: 550, stopdesk: 400, communes: [c('Chlef'), c('Ténès'), c('Boukadir'), c('Oued Fodda'), c('El Karimia', 50)] },
  { code: 3, name: 'Laghouat', home: 800, stopdesk: 600, communes: [c('Laghouat'), c('Aflou', 100), c('Aïn Madhi', 50), c("Hassi R'Mel", 100), c('Gueltat Sidi Saad', 100)] },
  { code: 4, name: 'Oum El Bouaghi', home: 650, stopdesk: 450, communes: [c('Oum El Bouaghi'), c('Aïn Beïda'), c("Aïn M'lila"), c('Aïn Kercha'), c('Souk Naamane')] },
  { code: 5, name: 'Batna', home: 650, stopdesk: 450, communes: [c('Batna'), c('Barika'), c('Merouana'), c('Aïn Touta'), c('Arris', 50), c('Tazoult')] },
  { code: 6, name: 'Béjaïa', home: 600, stopdesk: 430, communes: [c('Béjaïa'), c('Amizour'), c('Akbou'), c('Kherrata', 50), c('Sidi Aïch'), c('El Kseur')] },
  { code: 7, name: 'Biskra', home: 750, stopdesk: 550, communes: [c('Biskra'), c('Tolga'), c('Sidi Okba'), c('Foughala', 100), c('El Kantara', 100)] },
  { code: 8, name: 'Béchar', home: 1000, stopdesk: 800, communes: [c('Béchar'), c('Abadla'), c('Kenadsa'), c('Taghit', 150), c('Lahmar', 100)] },
  { code: 9, name: 'Blida', home: 450, stopdesk: 320, communes: [c('Blida'), c('Boufarik'), c('Larbaâ'), c('Mouzaïa'), c('El Affroun'), c('Ouled Yaïch')] },
  { code: 10, name: 'Bouira', home: 550, stopdesk: 400, communes: [c('Bouira'), c('Lakhdaria'), c('Aïn Bessem'), c('Sour El Ghozlane'), c('Bechloul', 50)] },
  { code: 11, name: 'Tamanrasset', home: 1400, stopdesk: 1100, communes: [c('Tamanrasset'), c('Abalessa', 200), c('Tazrouk', 300), c('Idlès', 200)] },
  { code: 12, name: 'Tébessa', home: 750, stopdesk: 550, communes: [c('Tébessa'), c('Bir El Ater', 50), c('El Kouif'), c('Cheria'), c('Negrine', 100)] },
  { code: 13, name: 'Tlemcen', home: 600, stopdesk: 430, communes: [c('Tlemcen'), c('Maghnia'), c('Remchi'), c('Nedroma'), c('Sebdou', 50), c('Mansourah')] },
  { code: 14, name: 'Tiaret', home: 650, stopdesk: 470, communes: [c('Tiaret'), c('Frenda'), c('Sougueur'), c('Ksar Chellala'), c('Rahouia', 50)] },
  { code: 15, name: 'Tizi Ouzou', home: 550, stopdesk: 400, communes: [c('Tizi Ouzou'), c('Azazga'), c('Draâ El Mizan'), c('Bouzeguene', 50), c('Tigzirt', 50), c('Azeffoun', 50)] },
  { code: 16, name: 'Alger', home: 400, stopdesk: 300, communes: [c('Alger Centre'), c('Bab El Oued'), c('Hydra'), c('Kouba'), c('El Biar'), c('Bir Mourad Raïs'), c('Bab Ezzouar'), c('Dar El Beïda'), c('Rouiba'), c('Zeralda'), c('Draria'), c('Birtouta')] },
  { code: 17, name: 'Djelfa', home: 750, stopdesk: 550, communes: [c('Djelfa'), c('Aïn Oussera'), c('Messaad', 50), c('El Idrissia'), c('Charef', 50)] },
  { code: 18, name: 'Jijel', home: 650, stopdesk: 450, communes: [c('Jijel'), c('Taher'), c('El Aouana'), c('El Milia'), c('Chekfa', 50)] },
  { code: 19, name: 'Sétif', home: 600, stopdesk: 430, communes: [c('Sétif'), c('El Eulma'), c('Bougaa'), c('Aïn Arnat'), c('Amoucha', 50), c('Aïn Oulmene')] },
  { code: 20, name: 'Saïda', home: 650, stopdesk: 470, communes: [c('Saïda'), c('Aïn El Hadjar'), c('Youb'), c('El Hassasna')] },
  { code: 21, name: 'Skikda', home: 650, stopdesk: 450, communes: [c('Skikda'), c('Collo'), c('Azzaba'), c('El Harrouch'), c('Tamalous')] },
  { code: 22, name: 'Sidi Bel Abbès', home: 600, stopdesk: 430, communes: [c('Sidi Bel Abbès'), c('Sfisef'), c('Telagh'), c('Ben Badis'), c('Tessala')] },
  { code: 23, name: 'Annaba', home: 650, stopdesk: 450, communes: [c('Annaba'), c('El Bouni'), c('Sidi Amar'), c('El Hadjar'), c('Berrahal')] },
  { code: 24, name: 'Guelma', home: 650, stopdesk: 470, communes: [c('Guelma'), c('Oued Zenati'), c('Héliopolis'), c('Bouchegouf', 50), c('Khezaras', 50)] },
  { code: 25, name: 'Constantine', home: 600, stopdesk: 430, communes: [c('Constantine'), c('El Khroub'), c('Didouche Mourad'), c('Aïn Smara'), c('Hamma Bouziane'), c('Zighoud Youcef')] },
  { code: 26, name: 'Médéa', home: 550, stopdesk: 400, communes: [c('Médéa'), c('Berrouaghia'), c('Ksar El Boukhari'), c('Tablat'), c('Aïn Boucif', 50)] },
  { code: 27, name: 'Mostaganem', home: 600, stopdesk: 430, communes: [c('Mostaganem'), c('Aïn Tédelès'), c('Hassi Mamèche'), c('Mesra'), c('Bouguirat')] },
  { code: 28, name: "M'Sila", home: 750, stopdesk: 550, communes: [c("M'Sila"), c('Bou Saâda', 50), c('Aïn El Melh', 100), c('Sidi Aïssa'), c('Chellal', 50)] },
  { code: 29, name: 'Mascara', home: 600, stopdesk: 430, communes: [c('Mascara'), c('Mohammadia'), c('Sig'), c('Ghriss'), c('Bou Hanifia')] },
  { code: 30, name: 'Ouargla', home: 900, stopdesk: 700, communes: [c('Ouargla'), c('Hassi Messaoud', 100), c('Rouissat'), c("N'Goussa"), c('Aïn Beida')] },
  { code: 31, name: 'Oran', home: 550, stopdesk: 400, communes: [c('Oran'), c('Bir El Djir'), c('Es Sénia'), c('Arzew'), c('Aïn El Turk'), c('Gdyel')] },
  { code: 32, name: 'El Bayadh', home: 850, stopdesk: 650, communes: [c('El Bayadh'), c('Brezina'), c('El Abiodh Sidi Cheikh'), c('Rogassa')] },
  { code: 33, name: 'Illizi', home: 1500, stopdesk: 1200, communes: [c('Illizi'), c('In Amenas', 200), c('Bordj Omar Driss', 200)] },
  { code: 34, name: 'Bordj Bou Arréridj', home: 600, stopdesk: 430, communes: [c('Bordj Bou Arréridj'), c('Ras El Oued'), c('Medjana'), c('Mansoura'), c('El Hamadia')] },
  { code: 35, name: 'Boumerdès', home: 450, stopdesk: 320, communes: [c('Boumerdès'), c('Boudouaou'), c('Thénia'), c('Zemmouri'), c('Khemis El Khechna'), c('Isser')] },
  { code: 36, name: 'El Tarf', home: 700, stopdesk: 500, communes: [c('El Tarf'), c('Besbes'), c('Dréan'), c('El Kala'), c("Ben M'Hidi")] },
  { code: 37, name: 'Tindouf', home: 1400, stopdesk: 1100, communes: [c('Tindouf'), c('Oum El Assel', 250)] },
  { code: 38, name: 'Tissemsilt', home: 650, stopdesk: 470, communes: [c('Tissemsilt'), c('Theniet El Had'), c('Khemisti'), c('Bordj Bou Naama', 50)] },
  { code: 39, name: 'El Oued', home: 900, stopdesk: 700, communes: [c('El Oued'), c('Debila'), c('Guemar'), c('Robbah'), c('Hassi Khalifa')] },
  { code: 40, name: 'Khenchela', home: 750, stopdesk: 550, communes: [c('Khenchela'), c('Kaïs'), c('El Hamma'), c('Chechar'), c('Bouhmama')] },
  { code: 41, name: 'Souk Ahras', home: 700, stopdesk: 500, communes: [c('Souk Ahras'), c('Sedrata'), c("M'daourouch"), c('Bir Bouhouche'), c('Haddada')] },
  { code: 42, name: 'Tipaza', home: 450, stopdesk: 320, communes: [c('Tipaza'), c('Cherchell'), c('Hadjout'), c('Kolea'), c('Bou Ismaïl'), c('Fouka')] },
  { code: 43, name: 'Mila', home: 650, stopdesk: 450, communes: [c('Mila'), c('Chelghoum Laïd'), c('Tassadane Haddada'), c('Rouached'), c('Grarem Gouga')] },
  { code: 44, name: 'Aïn Defla', home: 550, stopdesk: 400, communes: [c('Aïn Defla'), c('Khemis Miliana'), c('El Attaf'), c('Djendel', 50), c('Miliana')] },
  { code: 45, name: 'Naâma', home: 850, stopdesk: 650, communes: [c('Naâma'), c('Mécheria'), c('Aïn Sefra'), c('Tiout', 100), c('Moghrar', 100)] },
  { code: 46, name: 'Aïn Témouchent', home: 600, stopdesk: 430, communes: [c('Aïn Témouchent'), c('Beni Saf'), c('El Malah'), c('Hammam Bou Hadjar'), c('El Amria')] },
  { code: 47, name: 'Ghardaïa', home: 900, stopdesk: 700, communes: [c('Ghardaïa'), c('Metlili'), c('Berriane'), c('Guerrara'), c('Zelfana', 50)] },
  { code: 48, name: 'Relizane', home: 600, stopdesk: 430, communes: [c('Relizane'), c('Yellel'), c('Ammi Moussa'), c('Zemmoura'), c('Oued Rhiou')] },
  { code: 49, name: 'Timimoun', home: 1150, stopdesk: 900, communes: [c('Timimoun'), c('Charouine', 150), c('Aougrout', 150), c('Tinerkouk', 100)] },
  { code: 50, name: 'Bordj Badji Mokhtar', home: 1700, stopdesk: 1400, communes: [c('Bordj Badji Mokhtar'), c('Timiaouine', 300)] },
  { code: 51, name: 'Ouled Djellal', home: 850, stopdesk: 650, communes: [c('Ouled Djellal'), c('Sidi Khaled', 50), c('Doucen'), c('Chaïba', 50)] },
  { code: 52, name: 'Béni Abbès', home: 1150, stopdesk: 900, communes: [c('Béni Abbès'), c('Kerzaz', 150), c('Igli', 150), c('Beni Ikhlef', 100)] },
  { code: 53, name: 'In Salah', home: 1300, stopdesk: 1050, communes: [c('In Salah'), c('Foggaret Ezzaouia', 150), c('In Ghar', 150)] },
  { code: 54, name: 'In Guezzam', home: 1600, stopdesk: 1300, communes: [c('In Guezzam'), c('Tin Zaouatine', 200)] },
  { code: 55, name: 'Touggourt', home: 900, stopdesk: 700, communes: [c('Touggourt'), c('Temacine'), c('Megarine'), c('Nezla'), c('Tebesbest')] },
  { code: 56, name: 'Djanet', home: 1450, stopdesk: 1150, communes: [c('Djanet'), c('Bordj El Haouas', 250)] },
  { code: 57, name: "El M'Ghair", home: 900, stopdesk: 700, communes: [c("El M'Ghair"), c('Djamaa'), c('Sidi Amrane'), c("M'Rara")] },
  { code: 58, name: 'El Meniaa', home: 1050, stopdesk: 800, communes: [c('El Meniaa'), c('Hassi Gara', 100), c('Hassi Fehal', 100)] },
];
