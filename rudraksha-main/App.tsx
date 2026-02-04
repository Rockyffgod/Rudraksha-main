
import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';
import { LanguageProvider } from './contexts/LanguageContext';

// Lazy load pages for performance optimization
const Welcome = lazy(() => import('./pages/Welcome'));
const Auth = lazy(() => import('./pages/Auth'));
const Greeting = lazy(() => import('./pages/Greeting'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Planner = lazy(() => import('./pages/Planner'));
const StudyBuddy = lazy(() => import('./pages/StudyBuddy'));
const Library = lazy(() => import('./pages/Library'));
const Culture = lazy(() => import('./pages/Culture'));
const Health = lazy(() => import('./pages/Health'));
const Safety = lazy(() => import('./pages/Safety'));
const Game = lazy(() => import('./pages/Game'));
const Recipes = lazy(() => import('./pages/Recipes'));
const HeritageMap = lazy(() => import('./pages/HeritageMap'));
const Profile = lazy(() => import('./pages/Profile'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const Rewards = lazy(() => import('./pages/Rewards'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const ThemeSelection = lazy(() => import('./pages/ThemeSelection'));
const CommunityChat = lazy(() => import('./pages/CommunityChat'));
const MessengerBot = lazy(() => import('./automation/MessengerBot')); // New Import

const LoadingFallback = () => (
  <div className="h-screen w-full flex items-center justify-center bg-orange-50 dark:bg-gray-900">
    <Loader2 className="animate-spin text-red-600 w-12 h-12" />
  </div>
);

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <HashRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/greeting" element={<Greeting />} />
            
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="planner" element={<Planner />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="study-buddy" element={<StudyBuddy />} />
              <Route path="library" element={<Library />} />
              <Route path="culture" element={<Culture />} />
              <Route path="recipes" element={<Recipes />} />
              <Route path="map" element={<HeritageMap />} />
              <Route path="health" element={<Health />} />
              <Route path="safety" element={<Safety />} />
              <Route path="community-chat" element={<CommunityChat />} />
              <Route path="messenger-bot" element={<MessengerBot />} /> 
              <Route path="arcade" element={<Game />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:userId" element={<PublicProfile />} />
              <Route path="rewards" element={<Rewards />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/themes" element={<ThemeSelection />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
    </LanguageProvider>
  );
};

export default App;
