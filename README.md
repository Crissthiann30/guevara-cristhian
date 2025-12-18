Readme.md
🎮 PokéFinder - Aplicación Web de Búsqueda y Comparación de Pokémon

⸻

👤 Autor

Nombre del Estudiante:
Cristhian Octavio Guevara Sanchez
Correo institucional: cristhian.guevara1@utp.ac.pa
GitHub: Crissthiann30

Nombre del Estudiante:
Jonatan Santiago Vergara Birminghan
Correo institucional: jonatan.vergara@utp.ac.pa
GitHub: Arthurink

Carrera: Lic. en Desarrollo y Gestión de Software
Institución: Universidad Tecnológica de Panamá
Fecha: Diciembre 2025

⸻

📖 Descripción del Proyecto

PokéFinder es una aplicación web interactiva que permite a los usuarios buscar, explorar y comparar Pokémon utilizando la PokeAPI. La aplicación incorpora un diseño Brutalist con bordes gruesos, colores vibrantes y una experiencia de usuario intuitiva.

⸻

Características Principales

🔍 Búsqueda por nombre o ID de Pokémon
⚡ Búsqueda por Habilidad
🧬 Cadena Evolutiva completa
⚔️ Sistema VS para comparar dos Pokémon
📜 Histórico de búsquedas
❤️ Sistema de Favoritos
💾 Caché inteligente con TTL (24 horas)
🎨 Diseño Brutalist responsivo

⸻

🌐 Link a Demostración en Vivo

GitHub Pages:
https://crissthiann30.github.io/guevara-cristhian/

⸻

🚀 Instrucciones de Uso

Requisitos

Navegador moderno (Chrome, Firefox, Safari, Edge)
Conexión a Internet (para consumir PokeAPI)

⸻

Instalación Local

1. Clonar el repositorio

git clone https://github.com/tuusuario/vergara-jonatan.git
cd vergara-jonatan/semestral

2. Abrir en navegador (sin servidor necesario)

Opción A: Doble clic en index.html

Opción B: Usar Live Server de VS Code

Instalar extensión “Live Server”

Click derecho en index.html → “Open with Live Server”

Opción C: Usar Python local

python -m http.server 8000

Luego visita: http://localhost:8000

⸻

📍 Navegación de la Aplicación

1. 🔍 Búsqueda (index.html)

Selecciona “Pokémon” o “Habilidad” en el selector
Ingresa el nombre o ID del Pokémon/Habilidad
Presiona “BUSCAR” o la tecla Enter
Visualiza los detalles, estadísticas y cadena evolutiva

Click en una habilidad para buscarla
Click en una evolución para ver ese Pokémon

Indicadores:

🌐 DESDE API = datos recién obtenidos
📦 DESDE CACHÉ = datos guardados (más rápido)

⸻

2. 📜 Histórico (historico.html)

Ver todos los Pokémon buscados (más reciente primero)
🤍 Marcar como favorito
🗑️ Eliminar individual
“BORRAR TODO” para limpiar histórico y caché

⸻

3. ❤️ Favoritos (favoritos.html)

Ver lista de Pokémon marcados como favoritos
🗑️ Eliminar individual
“BORRAR TODO” para vaciar favoritos
Click en item para ver detalles del Pokémon

⸻

4. ⚔️ VS Battle (vs.html)

Ingresa Pokémon 1 y Pokémon 2
Presiona “¡BATALLAR!”

Visualiza:
🏆 Ganador determinado por stats totales + efectividad de tipos
📊 Comparación visual de estadísticas (HP, ATK, DEF, etc.)
⚡ Ventajas de tipo
🧮 Desglose del cálculo de puntaje

Marca como favorito desde la vista de batalla

⸻

📸 Capturas de Pantalla

[1] Búsqueda Principal

<img width="1699" height="890" alt="IMG_5542" src="https://github.com/user-attachments/assets/bf9ea442-b3a9-4f15-88d6-6e135da65996" />


[2] Cadena Evolutiva
<img width="1699" height="890" alt="IMG_5543" src="https://github.com/user-attachments/assets/f3fa2ab5-7478-4d50-a533-78e46b81a18c" />


[3] Búsqueda por Habilidad
<img width="1699" height="890" alt="IMG_5544" src="https://github.com/user-attachments/assets/e741ad67-0b08-4651-8cf0-9429f63ec43a" />


[4] Histórico

<img width="1699" height="890" alt="IMG_5552" src="https://github.com/user-attachments/assets/adfc8fd2-3abf-404e-a075-2f9cb9639084" />

[5] Favoritos
<img width="1699" height="890" alt="IMG_5553" src="https://github.com/user-attachments/assets/5a8e30e6-dd85-479f-b09e-d1eeebf3589d" />


[6] VS Battle

<img width="1699" height="890" alt="IMG_5554" src="https://github.com/user-attachments/assets/467ef019-ba48-472b-8c0a-68d0317f167f" />


Estructura del Semestral
---
📁 semestral/
├── 📄 index.html              # Página de búsqueda principal
├── 📄 historico.html          # Página de histórico
├── 📄 favoritos.html          # Página de favoritos
├── 📄 vs.html                 # Página de VS Battle
├── 🎨 shared.css              # Estilos compartidos (Brutalist)
├── 📜 shared.js               # Lógica JavaScript (módulo IIFE)
├── 📖 README.md               # Este documento (entregable)
└── 📁 screenshots/            # Carpeta para capturas
    ├── 1-busqueda.png
    ├── 2-evolucion.png
    ├── 3-habilidad.png
    ├── 4-historico.png
    ├── 5-favoritos.png
    └── 6-vs-battle.png
---

## 🧰 Tecnologías Utilizadas

| Tecnología | Propósito |
|----------|----------|
| HTML5 | Maquetación semántica |
| CSS3 | Diseño Brutalist (Flexbox, Grid, Variables CSS) |
| JavaScript (ES6+) | Lógica, manipulación del DOM y consumo de API |
| Fetch API | Comunicación con PokeAPI |
| localStorage | Persistencia (caché, histórico y favoritos) |
| Patrón IIFE | Organización modular del código |

---

## 🔌 API Consumida

**PokeAPI**  
https://pokeapi.co/api/v2/

### Endpoints Utilizados

| Endpoint | Propósito |
|--------|----------|
| `/pokemon/{name or id}` | Datos base del Pokémon (stats, tipos, habilidades) |
| `/pokemon-species/{id}` | Información de especie (ID de cadena evolutiva) |
| `/evolution-chain/{id}` | Cadena evolutiva completa con condiciones |
| `/ability/{name or id}` | Detalles de habilidad (descripción y Pokémon asociados) |

---

## 🎨 Características de Diseño

### Estilo Brutalist

✅ Bordes gruesos (4px sólidos negros)  
✅ Sombras duras (6px de offset, sin blur)  
✅ Tipografía monoespaciada (Courier New)  
✅ Colores vibrantes y alto contraste  
✅ Efecto de presión en botones (`transform` con hover/active)  
✅ Bordes redondeados mínimos (máx. 4–8px)  

### Paleta de Colores

- **Primario:** `#2d2d2d` (Negro oscuro)  
- **Secundario:** `#ff6b6b` (Rojo coral)  
- **Acento:** `#ffcc00` (Amarillo Pokémon)  
- **Success:** `#4ecdc4` (Verde agua)  
- **Background:** `#f5e6d3` (Beige claro)  

### Responsividad

✅ Pantallas móviles (< 768px)  
✅ Tabletas (768px – 1024px)  
✅ Escritorio (> 1024px)  
✅ Navegación intuitiva en todos los dispositivos  

---

## 🚨 Características Destacadas

### ⚡ Sistema de Caché Inteligente

- TTL de 24 horas (86,400 segundos)  
- Almacenamiento en `localStorage`  
- Indicadores visuales:
  - 🌐 **DESDE API:** datos recién obtenidos  
  - 📦 **DESDE CACHÉ:** datos almacenados  
- Limpieza manual desde la página de histórico  
- Eliminación automática de caché expirado  

---

### 📊 VS Battle Avanzado

Cálculo de puntuación basado en:

- Suma total de estadísticas base  
  (HP + ATK + DEF + SP.ATK + SP.DEF + SPD)  
- Multiplicador por efectividad de tipos:
  - 2× súper efectivo  
  - 0.5× poco efectivo  

Funcionalidades:
- Comparación visual de 6 estadísticas  
- Barras centradas desde el eje medio  
- Valores destacados (rojo para el mayor)  
- Análisis de ventajas/desventajas por tipo  
- Determinación automática del ganador  

---

### 🧬 Cadena Evolutiva Completa

- Detección automática del tipo de evolución  
- Evoluciones simples en línea recta  
- Evoluciones múltiples en filas separadas  
- Sprites oficiales por etapa  
- Condiciones de evolución visibles  
  (Nivel, ítems, intercambio, ubicación, etc.)  
- Flechas rojas (→) entre etapas  
- Click en evolución para búsqueda automática  

---

### ❤️ Sistema de Favoritos Persistente

- Persistencia mediante `localStorage`  
- Sincronización entre todas las páginas  
- Indicador visual de favorito (❤️)  
- Gestión desde:
  - Búsqueda  
  - Histórico  
  - Favoritos  
  - VS Battle  

---

## 📝 Notas de Desarrollo

### Optimizaciones Implementadas

✅ Reducción de llamadas a la API  
✅ Delegación de eventos  
✅ Lazy loading de evoluciones  
✅ Uso de patrón IIFE  
✅ Uso de sprites optimizados  

### Desafíos Resueltos

✅ Mapeo completo de efectividad de tipos  
✅ Lógica de cadenas evolutivas complejas  
✅ Sincronización global de favoritos  
✅ Manejo robusto de errores de API  
✅ Traducción de habilidades al español  

---

## 🤝 Contribuciones y Mejoras Futuras

- Tema oscuro / claro  
- Autocompletado en búsquedas  
- Sonidos de Pokémon  
- Exportación de favoritos (JSON / CSV)  
- Filtros avanzados  
- Estadísticas detalladas  
- Modo multijugador  
- Sistema de movimientos y ataques  

---

## 📞 Contacto y Soporte

**Repositorio GitHub:**  
https://github.com/Arthurink/vergara-jonatan  

**Demostración en Vivo (GitHub Pages):**  
https://arthurink.github.io/Poke-Finder/  

**Correos de contacto:**  
- jonatan.vergara@utp.ac.pa  
- cristhian.guevara1@utp.ac.pa  

---

## 📄 Licencia

Este proyecto fue desarrollado como parte de una evaluación académica  
en la **Universidad Tecnológica de Panamá**.

Derechos reservados © 2025  
**Jonatan Santiago Vergara Birminghan**  
**Cristhian Octavio Guevara Sanchez**

---

¡Gracias por usar **PokéFinder**! ⚡🔥💧  
¡Disfruta explorando, comparando y atrapando Pokémon! 🎮
