import React from 'react'
import Header from '../components/Header'
import { Outlet } from 'react-router-dom'
import MobileNav from '../components/MobileNav' // Importa el componente que creamos

export default function LayoutWithHeader() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
        <Header />
        
        {/* pb-24 asegura que el contenido no quede debajo del MobileNav en móvil */}
        <main className="pb-24 lg:pb-0"> 
            <Outlet />
        </main>

        <MobileNav />
    </div>
  )
}