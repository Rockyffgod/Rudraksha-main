
import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Grid, Layout, Maximize2, X, MapPin, Users, Mountain, Landmark, Droplets, BookOpen, User, Info, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/Button';

declare const L: any; // Leaflet global

interface ProvinceData {
  id: number;
  name: string;
  nepaliName: string;
  capital: string;
  capitalNe: string;
  districts: number;
  area: string;
  population: string;
  density: string;
  color: string;
  borderColor: string;
  description: string;
  descriptionNe: string;
  attractions: string[];
  attractionsNe: string[];
  image: string;
  majorRivers: string;
  majorRiversNe: string;
  literacyRate: string;
  mainLanguages: string;
  mainLanguagesNe: string;
  lat: number;
  lng: number;
}

const PROVINCES: ProvinceData[] = [
  {
    id: 1,
    name: "Koshi Province",
    nepaliName: "कोशी प्रदेश",
    capital: "Biratnagar",
    capitalNe: "विराटनगर",
    districts: 14,
    area: "25,905 km²",
    population: "4,972,021",
    density: "192/km²",
    color: "from-blue-600 to-cyan-500",
    borderColor: "border-blue-500",
    description: "Koshi Province is the easternmost region of Nepal, home to the world's highest peak, Mount Everest (8848m), and Kanchenjunga. It features diverse topography ranging from the Himalayas to the Terai plains.",
    descriptionNe: "कोशी प्रदेश नेपालको सबैभन्दा पूर्वी क्षेत्र हो, जहाँ विश्वको सर्वोच्च शिखर सगरमाथा (८८४८ मिटर) र कञ्चनजङ्घा रहेका छन्।",
    attractions: ["Mt. Everest", "Ilam Tea Gardens", "Koshi Tappu"],
    attractionsNe: ["सगरमाथा", "इलाम चिया बगान", "कोशी टप्पु"],
    image: "https://lh3.googleusercontent.com/gps-cs-s/AHVAwerHQlJuN4y6uGM7CNrGK7ZUKJS2nNpqsZDaYnsbybQU-ifpLuEixZHiUk_xjhyVFWZTi4tePP5270Hs1plo7ogPt7FU9limroXpkWhe5EuZsrQG5eFRZ5qntE7tHwBBkzp3wayUWg=w675-h390-n-k-no",
    majorRivers: "Koshi, Arun",
    majorRiversNe: "कोशी, अरुण",
    literacyRate: "71.2%",
    mainLanguages: "Nepali, Maithili",
    mainLanguagesNe: "नेपाली, मैथिली",
    lat: 26.4525,
    lng: 87.2718
  },
  {
    id: 2,
    name: "Madhesh Province",
    nepaliName: "मधेश प्रदेश",
    capital: "Janakpur",
    capitalNe: "जनकपुर",
    districts: 8,
    area: "9,661 km²",
    population: "6,126,288",
    density: "635/km²",
    color: "from-orange-500 to-yellow-500",
    borderColor: "border-orange-500",
    description: "The smallest province by area but rich in culture and history. It is the heart of Mithila culture and agriculture.",
    descriptionNe: "क्षेत्रफलको हिसाबले सबैभन्दा सानो तर संस्कृति र इतिहासमा धनी प्रदेश। यो मिथिला संस्कृतिको मुटु हो।",
    attractions: ["Janaki Mandir", "Mithila Art", "Parsa National Park"],
    attractionsNe: ["जानकी मन्दिर", "मिथिला कला", "पर्सा राष्ट्रिय निकुञ्ज"],
    image: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweo75bHM1SIYpxf2VNcZJ-svV5H5cMa_A-t80RRtkmqVB1jIbThYeNcJ0117uTZvThVmFlRkPoqEYlm0H3zQk-ZadZbCSLsruwQU2_GdqMlZR4Oj2W_bW1dTvWCnEKJXPiQWtoQ=w675-h390-n-k-no",
    majorRivers: "Bagmati, Kamala",
    majorRiversNe: "बागमती, कमला",
    literacyRate: "49.5%",
    mainLanguages: "Maithili, Bhojpuri",
    mainLanguagesNe: "मैथिली, भोजपुरी",
    lat: 26.7288,
    lng: 85.9274
  },
  {
    id: 3,
    name: "Bagmati Province",
    nepaliName: "बागमती प्रदेश",
    capital: "Hetauda",
    capitalNe: "हेटौंडा",
    districts: 13,
    area: "20,300 km²",
    population: "6,084,042",
    density: "300/km²",
    color: "from-red-600 to-pink-600",
    borderColor: "border-red-600",
    description: "Home to the federal capital, Kathmandu. It bridges the northern Himalayas with the southern plains and hosts major UNESCO Heritage sites.",
    descriptionNe: "संघीय राजधानी काठमाडौंको घर। यसले उत्तरी हिमाललाई दक्षिणी मैदानसँग जोड्छ र प्रमुख युनेस्को सम्पदा स्थलहरू समावेश गर्दछ।",
    attractions: ["Kathmandu Valley", "Chitwan National Park", "Langtang"],
    attractionsNe: ["काठमाडौं उपत्यका", "चितवन राष्ट्रिय निकुञ्ज", "लाङटाङ"],
    image: "https://lh3.googleusercontent.com/gps-cs-s/AHVAwepmdUwyFb1HIu4u53bB3TzJv32oVXMmcSSgCSOa-tP5FibBJt0mvV3TMmXm6z_rkLvDfAUZqkLbcOZbNtOSPqeLfddmVXhPb1tkUYqxrOI7We1Q6ZpG-WKdQoAORTBWNhjPEcJs=w675-h390-n-k-no",
    majorRivers: "Bagmati, Trishuli",
    majorRiversNe: "बागमती, त्रिशुली",
    literacyRate: "74.8%",
    mainLanguages: "Nepali, Newari",
    mainLanguagesNe: "नेपाली, नेवारी",
    lat: 27.4292,
    lng: 85.0325
  },
  {
    id: 4,
    name: "Gandaki Province",
    nepaliName: "गण्डकी प्रदेश",
    capital: "Pokhara",
    capitalNe: "पोखरा",
    districts: 11,
    area: "21,504 km²",
    population: "2,479,745",
    density: "116/km²",
    color: "from-emerald-500 to-green-600",
    borderColor: "border-emerald-500",
    description: "The tourism capital of Nepal. Gandaki province houses the majestic Annapurna range and is the gateway to world-famous treks.",
    descriptionNe: "नेपालको पर्यटन राजधानी। गण्डकी प्रदेशमा अन्नपूर्ण हिमशृङ्खला रहेको छ र यो पदयात्राको प्रवेशद्वार हो।",
    attractions: ["Pokhara", "Annapurna Circuit", "Muktinath"],
    attractionsNe: ["पोखरा", "अन्नपूर्ण सर्किट", "मुक्तिनाथ"],
    image: "https://lh3.googleusercontent.com/gps-cs-s/AHVAwerE0IehvUGkr-ri0Y2JqJShK2aUrKraupRmfZ72Odnx1pg9Cwnpw2QpOdWiDmNBvwo6mloNYK7wwRqcZT1UyCmBSOkQHNuEwyCVi4aJv4_Myl8yXls6Am8abAOjnviRGBJ4Pnhn=w675-h390-n-k-no",
    majorRivers: "Kali Gandaki, Seti",
    majorRiversNe: "काली गण्डकी, सेती",
    literacyRate: "74.8%",
    mainLanguages: "Nepali, Gurung",
    mainLanguagesNe: "नेपाली, गुरुङ",
    lat: 28.2380,
    lng: 83.9956
  },
  {
    id: 5,
    name: "Lumbini Province",
    nepaliName: "लुम्बिनी प्रदेश",
    capital: "Deukhuri",
    capitalNe: "देउखुरी",
    districts: 12,
    area: "22,288 km²",
    population: "5,124,225",
    density: "230/km²",
    color: "from-indigo-500 to-blue-600",
    borderColor: "border-indigo-500",
    description: "The birthplace of Lord Buddha. Lumbini province holds immense historical and spiritual significance.",
    descriptionNe: "भगवान बुद्धको जन्मस्थल। लुम्बिनी प्रदेशको ठूलो ऐतिहासिक र आध्यात्मिक महत्व छ।",
    attractions: ["Lumbini", "Bardiya National Park", "Palpa"],
    attractionsNe: ["लुम्बिनी", "बर्दिया राष्ट्रिय निकुञ्ज", "पाल्पा"],
    image: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweolNbMBfCLEcb-JoP1BKkohrqTtq1WsIQGDfBApeCx_ZwqiyMM1IwwUGB6-72BPDxuA7XB5dRAjYO_kBbgFOagQ4Pmtib72cDKbVuFLT-BsO7YGwhuRrLM1EInLL1HF49XR4dZ-Eg=w675-h390-n-k-no",
    majorRivers: "Rapti, Babai",
    majorRiversNe: "राप्ती, बबई",
    literacyRate: "66.4%",
    mainLanguages: "Nepali, Tharu",
    mainLanguagesNe: "नेपाली, थारु",
    lat: 27.8099,
    lng: 82.5186
  },
  {
    id: 6,
    name: "Karnali Province",
    nepaliName: "कर्णाली प्रदेश",
    capital: "Birendranagar",
    capitalNe: "वीरेन्द्रनगर",
    districts: 10,
    area: "27,984 km²",
    population: "1,694,889",
    density: "61/km²",
    color: "from-teal-600 to-emerald-700",
    borderColor: "border-teal-600",
    description: "The largest yet least populated province. Karnali is a remote, rugged, and breathtakingly beautiful region home to Rara Lake.",
    descriptionNe: "सबैभन्दा ठूलो तर कम जनसंख्या भएको प्रदेश। कर्णाली एक दुर्गम र सुन्दर क्षेत्र हो जहाँ रारा ताल अवस्थित छ।",
    attractions: ["Rara Lake", "Shey Phoksundo", "Upper Dolpo"],
    attractionsNe: ["रारा ताल", "शे-फोक्सुण्डो", "माथिल्लो डोल्पा"],
    image: "https://lh3.googleusercontent.com/gps-cs-s/AHVAwerD0R7t4jLghiYVAR2QcK15I2yM0SSWbSFlLVu2WRHDPFwNwxu72zabWeuY3vci3z0Kfa0B2CE9O5gDVlbSomlE8v06Hs6g4-VQ81SD_3SvW7U2sKs_m0oXmcyMYYEKqaIHASdAaA=w675-h390-n-k-no",
    majorRivers: "Karnali, Bheri",
    majorRiversNe: "कर्णाली, भेरी",
    literacyRate: "62.7%",
    mainLanguages: "Nepali, Magar",
    mainLanguagesNe: "नेपाली, मगर",
    lat: 28.6010,
    lng: 81.6369
  },
  {
    id: 7,
    name: "Sudurpashchim Province",
    nepaliName: "सुदूरपश्चिम प्रदेश",
    capital: "Godawari",
    capitalNe: "गोदावरी",
    districts: 9,
    area: "19,999 km²",
    population: "2,711,270",
    density: "136/km²",
    color: "from-purple-600 to-violet-600",
    borderColor: "border-purple-600",
    description: "Located in the far west, this province is rich in unspoiled natural beauty and unique Deuda culture.",
    descriptionNe: "सुदूर पश्चिममा अवस्थित, यो प्रदेश अछुतो प्राकृतिक सौन्दर्य र देउडा संस्कृतिमा धनी छ।",
    attractions: ["Khaptad", "Shuklaphanta", "Api Nampa"],
    attractionsNe: ["खप्तड", "शुक्लाफाँटा", "अपि नाम्पा"],
    image: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweqa0Vgu8fP66KID9-7yelqNiZ4ivnejIRzctBevCwH43INkW4-IjlVZWpEBwv_yh1LrmiGyRFsuKheyKoPY0JEmX8u8GnrzCnrrwSTHwrCiiwL6CzYP5nH3Jc-4r0WmlBNXg2FH=w675-h390-n-k-no",
    majorRivers: "Mahakali, Seti",
    majorRiversNe: "महाकाली, सेती",
    literacyRate: "63.5%",
    mainLanguages: "Doteli, Tharu",
    mainLanguagesNe: "डोटेली, थारु",
    lat: 28.8475,
    lng: 80.5638
  }
];

const ProvinceMap: React.FC = () => {
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');
  const [selectedProvince, setSelectedProvince] = useState<ProvinceData | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (viewMode === 'map' && mapRef.current) {
        if (!mapInstance.current) {
            initMap();
        } else {
            mapInstance.current.invalidateSize();
        }
    }
  }, [viewMode]);

  const initMap = () => {
    if (!mapRef.current || typeof L === 'undefined') return;

    mapInstance.current = L.map(mapRef.current).setView([28.3949, 84.1240], 7);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(mapInstance.current);

    PROVINCES.forEach(prov => {
       const iconHtml = `
         <div class="relative group">
            <div class="w-10 h-10 rounded-full border-4 border-white shadow-lg overflow-hidden transform transition-transform hover:scale-125 duration-300 ${prov.borderColor}">
               <img src="${prov.image}" class="w-full h-full object-cover" />
            </div>
            <div class="absolute -bottom-1 -right-1 bg-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md border border-gray-100">
               ${prov.id}
            </div>
         </div>
       `;
       
       const icon = L.divIcon({
           html: iconHtml,
           className: 'bg-transparent',
           iconSize: [40, 40],
           iconAnchor: [20, 20]
       });

       const marker = L.marker([prov.lat, prov.lng], { icon });
       
       const popupContent = `
         <div style="font-family: sans-serif; text-align: center; min-width: 200px;">
            <div style="height: 100px; border-radius: 8px; overflow: hidden; margin-bottom: 8px;">
               <img src="${prov.image}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <h3 style="margin: 0; font-weight: 800; font-size: 16px;">${language === 'ne' ? prov.nepaliName : prov.name}</h3>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">${language === 'ne' ? prov.capitalNe : prov.capital}</p>
            <button id="btn-prov-${prov.id}" style="margin-top: 8px; background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold;">
               ${t("View Details", "View Details")}
            </button>
         </div>
       `;

       marker.bindPopup(popupContent);
       marker.on('popupopen', () => {
           const btn = document.getElementById(`btn-prov-${prov.id}`);
           if (btn) btn.onclick = () => setSelectedProvince(prov);
       });
       marker.addTo(mapInstance.current);
    });
  };

  const localizeNumber = (value: string | number): string => {
    if (language === 'en') return value.toString();
    const str = value.toString();
    const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return str.replace(/[0-9]/g, (match) => devanagariDigits[parseInt(match)]);
  };

  return (
    <div className="flex flex-col pr-1">
      {/* View Toggle Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 shrink-0 gap-4">
         <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MapIcon className="text-blue-600"/> {t("Province Overview", "Province Overview")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                {t("Explore the 7 distinct provinces of Nepal.", "Explore the 7 distinct provinces of Nepal.")}
            </p>
         </div>
         
         {/* Scrollable Tabs System - Removed no-scrollbar for PC discoverability */}
         <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-md p-1 rounded-xl flex border border-white/20 shadow-lg overflow-x-auto snap-x scrollbar-thin scrollbar-thumb-gray-400">
            <button
                onClick={() => setViewMode('cards')}
                className={`px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all snap-start whitespace-nowrap font-bold text-sm ${viewMode === 'cards' ? 'bg-white shadow-sm text-gray-900' : 'text-white hover:bg-white/10'}`}
            >
                <Grid size={18} /> {t("Grid View", "Grid View")}
            </button>
            <button
                onClick={() => setViewMode('map')}
                className={`px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all snap-start whitespace-nowrap font-bold text-sm ${viewMode === 'map' ? 'bg-white shadow-sm text-gray-900' : 'text-white hover:bg-white/10'}`}
            >
                <MapIcon size={18} /> {t("Interactive Map", "Interactive Map")}
            </button>
         </div>
      </div>

      {/* Main Content Area - Flexible height to prevent clamping on PC */}
      <div className="flex-1 pb-20">
          {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {PROVINCES.map(prov => (
                      <div 
                        key={prov.id}
                        onClick={() => setSelectedProvince(prov)}
                        className="group bg-white dark:bg-gray-800/40 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl border border-white/10 hover:border-blue-500/50 transition-all duration-300 cursor-pointer hover:-translate-y-1"
                      >
                          <div className="h-56 overflow-hidden relative">
                              <img src={prov.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={prov.name} />
                              <div className={`absolute inset-0 bg-gradient-to-t ${prov.color} opacity-40 mix-blend-multiply`}></div>
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80"></div>
                              
                              <div className="absolute top-5 left-6">
                                  <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg border border-white/30 text-[10px] font-black text-white uppercase tracking-widest">
                                      {t("Province", "Province")} {prov.id}
                                  </div>
                              </div>

                              <div className="absolute bottom-5 left-6 text-white pr-10">
                                  <h3 className="text-3xl font-black italic tracking-tighter leading-tight uppercase drop-shadow-xl">
                                      {language === 'ne' ? prov.nepaliName : prov.name}
                                  </h3>
                              </div>
                          </div>

                          <div className="p-6 space-y-6">
                              <div className="flex flex-wrap gap-3">
                                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-xl text-xs font-black text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/5 uppercase italic tracking-tighter">
                                      <MapPin size={14} className="text-blue-500" /> {language === 'ne' ? prov.capitalNe : prov.capital}
                                  </div>
                                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-xl text-xs font-black text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/5 uppercase tracking-widest">
                                      {localizeNumber(prov.districts)} Districts
                                  </div>
                              </div>
                              
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed font-medium italic">
                                  "{language === 'ne' ? prov.descriptionNe : prov.description}"
                              </p>

                              <button className="w-full h-12 bg-gray-50 dark:bg-white/5 hover:bg-blue-600 dark:hover:bg-blue-600 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 dark:text-gray-300 hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-blue-600/20">
                                  {t("View Detailed Atlas", "View Detailed Atlas")} <ArrowRight size={16} className="transition-transform group-hover:translate-x-2"/>
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="h-[600px] bg-gray-100 dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner relative min-h-[500px]">
                  <div ref={mapRef} className="w-full h-full z-0" />
                  <div className="absolute top-6 right-6 z-[400] bg-white/90 dark:bg-black/80 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-gray-200 dark:border-gray-700 max-w-xs">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-black uppercase tracking-widest italic border-b pb-2 border-gray-100 dark:border-gray-800">Map Legend</p>
                      <div className="grid grid-cols-1 gap-2.5">
                          {PROVINCES.map(p => (
                              <div key={p.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => { 
                                   mapInstance.current?.flyTo([p.lat, p.lng], 9);
                                   setSelectedProvince(p);
                              }}>
                                  <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${p.color} shadow-sm group-hover:scale-125 transition-transform`}></div>
                                  <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest group-hover:text-blue-500 transition-colors">{language === 'ne' ? p.nepaliName : p.name}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* Detail Modal */}
      {selectedProvince && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setSelectedProvince(null)}></div>
            <div className="bg-white dark:bg-gray-900 w-full max-w-6xl max-h-[90vh] rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300 border-4 border-gray-900">
                <button 
                    onClick={() => setSelectedProvince(null)}
                    className="absolute top-6 right-6 z-10 p-3 bg-black/40 hover:bg-red-600 text-white rounded-full transition-all active:scale-90 backdrop-blur-md"
                >
                    <X size={28} />
                </button>

                <div className="md:w-2/5 relative h-72 md:h-auto shrink-0 group">
                    <img 
                        src={selectedProvince.image} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        alt={selectedProvince.name}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r ${selectedProvince.color} mix-blend-multiply opacity-80`}></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90"></div>
                    
                    <div className="absolute bottom-0 left-0 p-10 text-white w-full">
                        <span className="inline-block px-4 py-1.5 border border-white/30 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black mb-4 uppercase tracking-widest shadow-2xl">
                            {t("Province", "Province")} {localizeNumber(selectedProvince.id)} Official Data
                        </span>
                        <h2 className="text-5xl md:text-7xl font-black mb-3 leading-none italic tracking-tighter uppercase drop-shadow-2xl">{language === 'en' ? selectedProvince.name : selectedProvince.nepaliName}</h2>
                        <div className="flex gap-6 mt-8">
                            <div className="text-center">
                                <p className="text-xs text-white/60 uppercase font-black tracking-widest mb-1">{t("Area", "Area")}</p>
                                <p className="font-black text-xl italic">{localizeNumber(selectedProvince.area)}</p>
                            </div>
                            <div className="w-px bg-white/20 h-10 self-center"></div>
                            <div className="text-center">
                                <p className="text-xs text-white/60 uppercase font-black tracking-widest mb-1">{t("Population", "Population")}</p>
                                <p className="font-black text-xl italic">{localizeNumber(selectedProvince.population)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:w-3/5 p-8 md:p-12 overflow-y-auto bg-white dark:bg-gray-950 custom-scrollbar">
                    <div className="flex flex-wrap gap-4 mb-10">
                        <div className="flex-1 min-w-[160px] bg-gray-50 dark:bg-gray-900 p-5 rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">{t("Administrative Capital", "Administrative Capital")}</p>
                            <p className="font-black text-gray-900 dark:text-white flex items-center gap-3 text-2xl italic tracking-tighter uppercase">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600"><Landmark size={20}/></div>
                                {language === 'en' ? selectedProvince.capital : selectedProvince.capitalNe}
                            </p>
                        </div>
                        <div className="flex-1 min-w-[160px] bg-gray-50 dark:bg-gray-900 p-5 rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">{t("Districts", "Districts")}</p>
                            <p className="font-black text-gray-900 dark:text-white flex items-center gap-3 text-2xl italic tracking-tighter">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-xl text-orange-600"><Layout size={20}/></div>
                                {localizeNumber(selectedProvince.districts)} Units
                            </p>
                        </div>
                    </div>

                    <div className="space-y-12">
                        <div>
                            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em] mb-4 italic flex items-center gap-2">
                                <Info size={16} className="text-blue-500"/> Regional Overview
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg p-6 bg-blue-50/30 dark:bg-blue-900/10 rounded-[2rem] border-2 border-blue-50 dark:border-blue-900/20 italic font-medium">
                                "{language === 'en' ? selectedProvince.description : selectedProvince.descriptionNe}"
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                            <div>
                                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em] mb-6 italic flex items-center gap-2">
                                    <Mountain size={16} className="text-green-500"/> Landmark Sites
                                </h3>
                                <ul className="space-y-3">
                                    {(language === 'en' ? selectedProvince.attractions : selectedProvince.attractionsNe).map((attr, idx) => (
                                        <li key={idx} className="flex items-center gap-4 text-sm font-black uppercase italic tracking-tighter text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                            {attr}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Droplets size={14} className="text-blue-500"/> Vital Waterways</h3>
                                    <p className="text-lg font-black text-gray-800 dark:text-gray-100 italic tracking-tighter uppercase">{language === 'en' ? selectedProvince.majorRivers : selectedProvince.majorRiversNe}</p>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><BookOpen size={14} className="text-emerald-500"/> Literacy Index</h3>
                                    <p className="text-3xl font-black text-gray-800 dark:text-gray-100 italic tracking-tighter">{localizeNumber(selectedProvince.literacyRate)}</p>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><User size={14} className="text-purple-500"/> Primary Dialects</h3>
                                    <p className="text-lg font-black text-gray-800 dark:text-gray-100 italic tracking-tighter uppercase">{language === 'en' ? selectedProvince.mainLanguages : selectedProvince.mainLanguagesNe}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProvinceMap;
