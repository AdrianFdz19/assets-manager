import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom';
import AssetsList from './features/assets/AssetsList';
import SignIn from './features/auth/SignIn';
import ProtectedRoute from './features/auth/ProtectedRoute';
import LayoutWithHeader from './layouts/LayoutWithHeader';
import Dashboard from './views/Dashboard';
import AssetDetail from './features/assets/AssetDetail';
import EditAsset from './features/assets/EditAsset';
import Categories from './features/categories/Categories';
import { Toaster } from 'react-hot-toast';
import UserProfile from './features/users/UserProfile';

function App() {

  return (
    <>
      <div className="app">
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          {/* Rutas Públicas */}
          <Route path='/signin' element={<SignIn />} />

          {/* Rutas Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<LayoutWithHeader />} >
              {/* ASSETS  */}
              <Route path='/assets' element={<AssetsList />} />
              <Route path='/assets/:assetId' element={<AssetDetail />} />
              <Route path='/assets/edit/:assetId' element={<EditAsset />} />

              {/* HOME / DASHBOARD  */}
              <Route path='/' element={<Dashboard />} />
              <Route path='/dashboard' element={<Dashboard />} ></Route>

              {/* CATEGORIES  */}
              <Route path='/categories' element={<Categories />} ></Route>

              {/* USER PROFILE */}
              <Route path='/profile' element={<UserProfile />} ></Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/assets" />} />
        </Routes>
      </div>
    </>
  )
}

export default App
