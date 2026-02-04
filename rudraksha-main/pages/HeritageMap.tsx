
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { Map as MapIcon, Loader2, Navigation, Compass, Search, List, X, MapPin, History, BookOpen, Star, MessageSquare, ArrowLeft, LocateFixed, Mountain, Landmark, Droplets, User, Info, Layout, Layers, Bot, Route, ChevronUp, ChevronDown, Satellite } from 'lucide-react';
import { HeritageService } from '../services/heritageService';
import { StorageService } from '../services/storageService';
import { HeritageSite, Review, ProvinceData } from '../types';
import { PROVINCES } from '../data/staticData';
import { useLanguage } from '../contexts/LanguageContext';

declare const L: any; // Leaflet global

// Satellite Map Tile URL (Esri World Imagery)
const SATELLITE_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

const HeritageMap: React.FC = () => {
  const { t, language } = useLanguage();
  const [sites, setSites] = useState<HeritageSite[]>([]);
  const [filteredSites, setFilteredSites] = useState<HeritageSite[]>([]);
  const [filteredProvinces, setFilteredProvinces] = useState<ProvinceData[]>(PROVINCES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Selection State
  const [selectedSite, setSelectedSite] = useState<HeritageSite | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<ProvinceData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Location
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  
  // Mode State
  const [activeMode, setActiveMode] = useState<'heritage' | 'provinces'>('heritage');
  const [isMobileListExpanded, setIsMobileListExpanded] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerClusterGroupRef = useRef<any>(null);
  const provinceLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // --- LIVE LOCATION TRACKING ---
  useEffect(() => {
    if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserPos([latitude, longitude]);
                if (mapInstanceRef.current) {
                    if (userMarkerRef.current) {
                        userMarkerRef.current.setLatLng([latitude, longitude]);
                    } else {
                        const icon = L.divIcon({
                            className: 'user-location-marker',
                            html: `<div class="relative w-4 h-4"><div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div><div class="relative w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div></div>`,
                            iconSize: [16, 16],
                            iconAnchor: [8, 8]
                        });
                        userMarkerRef.current = L.marker([latitude, longitude], { icon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current);
                    }
                }
            },
            (error) => console.warn("Location error:", error),
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // --- RUDRA CONTROL ---
  useEffect(() => {
    const handleRemoteControl = (e: any) => {
        const { type, targetName } = e.detail;
        if (type === 'province') {
            const province = PROVINCES.find(p => p.name.toLowerCase().includes(targetName.toLowerCase()));
            if (province) {
                handleSelectProvince(province);
                // Force open info tab if handled by AI
                setSelectedProvince(province); 
            }
        } else if (type === 'site') {
            const site = sites.find(s => s.name.toLowerCase().includes(targetName.toLowerCase()));
            if (site) {
                handleSelectSite(site);
                setSelectedSite(site);
            }
        } else if (type === 'reset') {
             mapInstanceRef.current?.flyTo([28.3949, 84.1240], 7);
             setSelectedSite(null);
             setSelectedProvince(null);
        }
    };
    window.addEventListener('rudraksha-map-control', handleRemoteControl);
    return () => window.removeEventListener('rudraksha-map-control', handleRemoteControl);
  }, [sites]);

  useEffect(() => {
    const loadSites = async () => {
      setLoading(true);
      const data = await HeritageService.getAllSites();
      setSites(data);
      setFilteredSites(data);
      setLoading(false);
      setTimeout(() => initMap(data), 100);
    };
    loadSites();
  }, []);

  // Filtering Logic
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    
    if (activeMode === 'heritage') {
        let result = sites;
        if (query) {
            result = result.filter(site => (language === 'ne' ? site.nameNe : site.name).toLowerCase().includes(query));
        }
        if (selectedCategory !== 'All') {
            result = result.filter(site => site.category === selectedCategory);
        }
        setFilteredSites(result);
        if (mapInstanceRef.current) updateHeritageMarkers(result);
        // Hide province markers
        if (provinceLayerRef.current) provinceLayerRef.current.clearLayers();
    } else {
        // Province Mode
        let result = PROVINCES;
        if (query) {
            result = result.filter(prov => (language === 'ne' ? prov.nepaliName : prov.name).toLowerCase().includes(query));
        }
        setFilteredProvinces(result);
        if (mapInstanceRef.current) updateProvinceMarkers(result);
        // Hide heritage markers
        if (markerClusterGroupRef.current) markerClusterGroupRef.current.clearLayers();
    }
  }, [searchQuery, selectedCategory, sites, activeMode, language]);

  const initMap = (initialSites: HeritageSite[]) => {
    if (!mapContainerRef.current || mapInstanceRef.current || typeof L === 'undefined') return;
    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([28.3949, 84.1240], 7);
    mapInstanceRef.current = map;
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Set Satellite Tile Layer
    tileLayerRef.current = L.tileLayer(SATELLITE_TILE_URL, { 
        maxZoom: 19, 
        attribution: SATELLITE_ATTRIBUTION 
    }).addTo(map);
    
    // Add Layer Groups
    if (L.markerClusterGroup) {
        markerClusterGroupRef.current = L.markerClusterGroup({ showCoverageOnHover: false, zoomToBoundsOnClick: true, removeOutsideVisibleBounds: true });
        map.addLayer(markerClusterGroupRef.current);
    } else {
        markerClusterGroupRef.current = L.layerGroup().addTo(map);
    }
    provinceLayerRef.current = L.layerGroup().addTo(map);

    // Initial Load
    if (activeMode === 'heritage') updateHeritageMarkers(initialSites);
    else updateProvinceMarkers(PROVINCES);
  };

  const handleSelectSite = (site: HeritageSite) => {
      setSelectedProvince(null);
      setSelectedSite(site);
      setActiveMode('heritage');
      setIsMobileListExpanded(false);
      mapInstanceRef.current?.flyTo([site.latitude, site.longitude], 16, { duration: 1.5 });
  };

  const handleSelectProvince = (prov: ProvinceData) => {
      setSelectedSite(null);
      setSelectedProvince(prov);
      setActiveMode('provinces');
      setIsMobileListExpanded(false);
      mapInstanceRef.current?.flyTo([prov.lat, prov.lng], 9, { duration: 1.5 });
  };

  const updateHeritageMarkers = (sitesData: HeritageSite[]) => {
    if (!markerClusterGroupRef.current) return;
    markerClusterGroupRef.current.clearLayers();
    const newMarkers: any[] = [];
    sitesData.forEach(site => {
      const icon = L.divIcon({
        className: 'custom-icon',
        html: `<div class="w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white hover:scale-110 transition-transform"><img src="${site.imageUrl}" class="w-full h-full object-cover"/></div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });
      const marker = L.marker([site.latitude, site.longitude], { icon });
      marker.on('click', () => handleSelectSite(site));
      newMarkers.push(marker);
    });
    
    if (markerClusterGroupRef.current.addLayers) {
        markerClusterGroupRef.current.addLayers(newMarkers);
    } else {
        newMarkers.forEach(m => markerClusterGroupRef.current.addLayer(m));
    }
  };

  const updateProvinceMarkers = (provincesData: ProvinceData[]) => {
      if (!provinceLayerRef.current) return;
      provinceLayerRef.current.clearLayers();
      provincesData.forEach(prov => {
         // Same style as heritage markers now
         const icon = L.divIcon({
             html: `<div class="relative group cursor-pointer hover:scale-110 transition-transform"><div class="w-12 h-12 rounded-full border-2 border-white shadow-xl overflow-hidden bg-gradient-to-br ${prov.color} p-0.5"><img src="${prov.image}" class="w-full h-full object-cover rounded-full" /></div><div class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white text-[10px] font-black px-2 py-0.5 rounded shadow-md whitespace-nowrap text-gray-900">${prov.name}</div></div>`,
             className: 'bg-transparent',
             iconSize: [48, 48],
             iconAnchor: [24, 24]
         });
         const marker = L.marker([prov.lat, prov.lng], { icon });
         marker.on('click', () => handleSelectProvince(prov));
         marker.addTo(provinceLayerRef.current);
      });
  };

  const categories = ['All', 'Temple', 'Stupa', 'Palace', 'Nature', 'Other'];
  
  const localizeNumber = (value: string | number): string => {
    if (language === 'en') return value.toString();
    const str = value.toString();
    const digits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return str.replace(/[0-9]/g, (m) => digits[parseInt(m)]);
  };

  return (
    <div className="relative h-[calc(100dvh-85px)] md:h-[calc(100vh-85px)] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-gray-900">
        
        {/* MAP CONTAINER */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {/* LOADING OVERLAY */}
        {loading && (
            <div className="absolute inset-0 z-[500] bg-black/20 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="animate-spin text-white w-12 h-12"/>
            </div>
        )}

        {/* TOP CONTROLS (Floating Mode Toggle) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] flex gap-1 p-1 bg-black/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 scale-90 md:scale-100 origin-top">
            <button onClick={() => { setActiveMode('heritage'); setSearchQuery(''); setSelectedProvince(null); }} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeMode === 'heritage' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-300 hover:text-white'}`}>
                <Compass size={16}/> Heritage
            </button>
            <button onClick={() => { setActiveMode('provinces'); setSearchQuery(''); setSelectedSite(null); }} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeMode === 'provinces' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:text-white'}`}>
                <Layout size={16}/> Provinces
            </button>
        </div>

        {/* SEARCH & LIST PANEL (Responsive: Sidebar on Desktop, Bottom Sheet on Mobile) */}
        <div className={`
            z-[400] flex flex-col gap-3 pointer-events-none transition-all duration-500 ease-out
            fixed bottom-0 left-0 right-0 p-4 pb-20 md:pb-4
            md:absolute md:top-6 md:left-6 md:bottom-6 md:w-80 md:p-0
            ${isMobileListExpanded ? 'h-[60dvh]' : 'h-auto'} md:h-auto
        `}>
            {/* Search Box */}
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-4 rounded-[2rem] shadow-2xl border border-white/20 pointer-events-auto space-y-3 shrink-0">
                {/* Mobile Toggle Handle */}
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto md:hidden" onClick={() => setIsMobileListExpanded(!isMobileListExpanded)}></div>
                
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                    <input 
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setIsMobileListExpanded(true); }}
                        onFocus={() => setIsMobileListExpanded(true)}
                        placeholder={activeMode === 'heritage' ? t("Search heritage...", "Search heritage...") : t("Search provinces...", "Search provinces...")}
                        className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-red-500/50 dark:text-white transition-all"
                    />
                </div>
                {activeMode === 'heritage' && (
                    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-red-500 text-white border-red-500' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Results List */}
            <div className={`flex-1 overflow-hidden pointer-events-none transition-opacity duration-300 ${isMobileListExpanded ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                <div className="h-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/20 pointer-events-auto overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {activeMode === 'heritage' ? (
                        filteredSites.map(site => (
                            <div key={site.id} onClick={() => handleSelectSite(site)} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border-2 ${selectedSite?.id === site.id ? 'bg-red-50 dark:bg-red-900/20 border-red-500' : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                <img src={site.imageUrl} className="w-12 h-12 rounded-lg object-cover bg-gray-200" alt=""/>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-black uppercase text-gray-900 dark:text-white truncate">{language === 'ne' ? (site.nameNe || site.name) : site.name}</h4>
                                    <p className="text-[10px] text-gray-500 truncate">{site.category} • {site.region}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        filteredProvinces.map(prov => (
                            <div key={prov.id} onClick={() => handleSelectProvince(prov)} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border-2 ${selectedProvince?.id === prov.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${prov.color} p-0.5`}><img src={prov.image} className="w-full h-full object-cover rounded-md"/></div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-black uppercase text-gray-900 dark:text-white truncate">{language === 'ne' ? prov.nepaliName : prov.name}</h4>
                                    <p className="text-[10px] text-gray-500 truncate">{localizeNumber(prov.districts)} Districts</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {/* DETAILS PANEL (Unified for both Modes) */}
        {(selectedSite || selectedProvince) && (
            <div className={`
                fixed inset-0 z-[500] md:absolute md:inset-auto md:top-6 md:right-6 md:bottom-6 md:w-[400px] md:z-[401]
                pointer-events-none flex flex-col items-end
            `}>
                <div className="h-full w-full bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl md:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-0 md:border border-white/20 pointer-events-auto overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 md:slide-in-from-right-20 duration-300">
                    {/* Panel Header Image */}
                    <div className="relative h-48 md:h-48 shrink-0">
                        <img 
                            src={selectedSite?.imageUrl || selectedProvince?.image} 
                            className="w-full h-full object-cover" 
                            alt="Header" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <button onClick={() => { setSelectedSite(null); setSelectedProvince(null); }} className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full hover:bg-red-600 transition-colors backdrop-blur-md z-10"><X size={20}/></button>
                        
                        <div className="absolute bottom-4 left-6 right-6">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white mb-2 shadow-lg ${selectedSite ? 'bg-red-600' : 'bg-blue-600'}`}>
                                {selectedSite ? selectedSite.category : `Province ${localizeNumber(selectedProvince!.id)}`}
                            </span>
                            <h2 className="text-2xl font-black text-white leading-none italic uppercase tracking-tighter drop-shadow-xl">
                                {selectedSite ? (language === 'ne' ? selectedSite.nameNe : selectedSite.name) : (language === 'ne' ? selectedProvince?.nepaliName : selectedProvince?.name)}
                            </h2>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 dark:bg-black/20 flex flex-col">
                        <div className="p-6 space-y-6">
                            {/* Province Specific Stats Grid */}
                            {selectedProvince ? (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Capital</p>
                                            <p className="font-black text-sm dark:text-white">{language === 'ne' ? selectedProvince.capitalNe : selectedProvince.capital}</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Area</p>
                                            <p className="font-black text-sm dark:text-white">{localizeNumber(selectedProvince.area)}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Capital Satellite Uplink (Static Visual Placeholder) */}
                                    <div className="bg-black rounded-2xl overflow-hidden shadow-lg border-2 border-gray-800 relative group">
                                        <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[9px] font-black text-green-400 uppercase tracking-widest flex items-center gap-1 border border-green-500/30">
                                            <Satellite size={10} className="animate-pulse"/> Capital Uplink
                                        </div>
                                        <div className="h-32 bg-gray-800 relative">
                                            {/* Using a generic high-res satellite looking image for visual effect since real-time requires key */}
                                            <img 
                                                src="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/1744/3028" 
                                                className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-1000"
                                                alt="Satellite View"
                                            />
                                            <div className="absolute inset-0 bg-scanline pointer-events-none"></div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <MapPin size={16} className="text-red-500"/>
                                    <p className="font-black text-sm dark:text-white">{selectedSite?.region}</p>
                                </div>
                            )}

                            <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                <h3 className="text-xs font-black uppercase text-gray-400 mb-2 tracking-widest flex items-center gap-2"><Info size={14}/> About</h3>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {selectedSite ? (language === 'ne' ? selectedSite.descriptionNe : selectedSite.description) : (language === 'ne' ? selectedProvince?.descriptionNe : selectedProvince?.description)}
                                </p>
                            </div>

                            {selectedSite ? (
                                <Button 
                                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedSite.latitude},${selectedSite.longitude}`, '_blank')} 
                                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-600/20"
                                >
                                    <Navigation size={16} className="mr-2"/> Get Directions
                                </Button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                        <h3 className="text-xs font-black uppercase text-gray-400 mb-3 tracking-widest flex items-center gap-2"><Mountain size={14} className="text-green-500"/> Attractions</h3>
                                        <ul className="space-y-2">
                                            {(language === 'en' ? selectedProvince!.attractions : selectedProvince!.attractionsNe).map((attr, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> {attr}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                        <h3 className="text-xs font-black uppercase text-gray-400 mb-2 tracking-widest flex items-center gap-2"><User size={14} className="text-purple-500"/> Languages</h3>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{language === 'en' ? selectedProvince!.mainLanguages : selectedProvince!.mainLanguagesNe}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Locate Button */}
        <button onClick={() => { if(userPos && mapInstanceRef.current) mapInstanceRef.current.flyTo(userPos, 14); }} className="absolute bottom-20 md:bottom-6 right-6 md:right-[440px] z-[390] p-3 bg-black/60 backdrop-blur-md rounded-full shadow-xl hover:scale-110 transition-transform text-white border border-white/20">
            <LocateFixed size={24}/>
        </button>
        
        <style>{`
            .bg-scanline {
                background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
                background-size: 100% 4px;
            }
        `}</style>
    </div>
  );
};

export default HeritageMap;
