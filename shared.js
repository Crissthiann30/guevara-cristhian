// ========================================
// POKÉFINDER - Unified JavaScript Module
// Patrón IIFE según estándares del curso
// ========================================

(() => {
    'use strict';

    // === CONFIGURACIÓN GLOBAL ===
    const API_BASE = 'https://pokeapi.co/api/v2';
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

    // === UTILS: MÓDULO DE ALMACENAMIENTO ===
    // Funciones de utilidad para localStorage (cache, historial, favoritos)
    const StorageManager = {
        // Cache
        getCache(key) {
            const cached = localStorage.getItem(`cache_${key}`);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp > CACHE_TTL) {
                localStorage.removeItem(`cache_${key}`);
                return null;
            }
            return data.value;
        },

        setCache(key, value) {
            const data = {
                value: value,
                timestamp: Date.now()
            };
            localStorage.setItem(`cache_${key}`, JSON.stringify(data));
        },

        clearCache() {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('cache_')) {
                    localStorage.removeItem(key);
                }
            });
        },

        // Histórico
        getHistory() {
            const history = localStorage.getItem('history');
            return history ? JSON.parse(history) : [];
        },

        addToHistory(pokemon) {
            let history = this.getHistory();
            
            // Evitar duplicados
            history = history.filter(p => p.id !== pokemon.id);
            
            // Agregar al inicio
            history.unshift(pokemon);
            
            // Limitar a 50 elementos
            if (history.length > 50) {
                history = history.slice(0, 50);
            }
            
            localStorage.setItem('history', JSON.stringify(history));
        },

        clearHistory() {
            localStorage.removeItem('history');
        },

        removeFromHistory(pokemonId) {
            let history = this.getHistory();
            history = history.filter(p => p.id !== pokemonId);
            localStorage.setItem('history', JSON.stringify(history));
        },

        // Favoritos
        getFavorites() {
            const favorites = localStorage.getItem('favorites');
            return favorites ? JSON.parse(favorites) : [];
        },

        addToFavorites(pokemon) {
            let favorites = this.getFavorites();
            
            // Verificar si ya existe
            if (favorites.some(p => p.id === pokemon.id)) {
                return false;
            }
            
            favorites.push(pokemon);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            return true;
        },

        removeFromFavorites(pokemonId) {
            let favorites = this.getFavorites();
            favorites = favorites.filter(p => p.id !== pokemonId);
            localStorage.setItem('favorites', JSON.stringify(favorites));
        },

        isFavorite(pokemonId) {
            const favorites = this.getFavorites();
            return favorites.some(p => p.id === pokemonId);
        },

        clearFavorites() {
            localStorage.removeItem('favorites');
        }
    };

    // === UTILS: MÓDULO DE API ===
    // Funciones de utilidad para comunicación con PokeAPI
    const PokeAPI = {
        /**
         * fetchWithCache: obtiene un endpoint con caché (TTL) en localStorage.
         * Usa StorageManager; retorna { data, fromCache }.
         */
        async fetchWithCache(url, key) {
            // Verificar cache
            const cached = StorageManager.getCache(key);
            if (cached) {
                return { data: cached, fromCache: true };
            }

            // Fetch de la API
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            StorageManager.setCache(key, data);
            
            return { data, fromCache: false };
        },

        /**
         * getPokemon: obtiene datos base y metadatos de especie para la cadena evolutiva.
         */
        async getPokemon(nameOrId) {
            const url = `${API_BASE}/pokemon/${nameOrId.toLowerCase()}`;
            const result = await this.fetchWithCache(url, `pokemon_${nameOrId.toLowerCase()}`);
            
            // Obtener species para la cadena evolutiva
            const speciesUrl = result.data.species.url;
            const speciesResult = await this.fetchWithCache(speciesUrl, `species_${result.data.id}`);
            
            return {
                ...result,
                data: {
                    ...result.data,
                    species_data: speciesResult.data
                }
            };
        },

        /**
         * getEvolutionChain: obtiene la cadena evolutiva completa desde species.evolution_chain.url.
         */
        async getEvolutionChain(url) {
            const id = url.split('/').filter(Boolean).pop();
            const result = await this.fetchWithCache(url, `evolution_${id}`);
            return result.data;
        },

        async getAbility(nameOrId) {
            const url = `${API_BASE}/ability/${nameOrId.toLowerCase()}`;
            const result = await this.fetchWithCache(url, `ability_${nameOrId.toLowerCase()}`);
            return result;
        }
    };

    // === TEMPLATES Y UTILS: MÓDULO DE UI ===
    // Renderizado de vistas (templates) y utilidades de presentación
    const UI = {
        // Mostrar loading
        showLoading(container, message = 'Cargando...') {
            container.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p class="loading-text">${message}</p>
                </div>
            `;
            container.classList.remove('hidden');
        },

        // Mostrar error
        showError(container, message) {
            container.innerHTML = `
                <div class="pokemon-card">
                    <div class="empty-state">
                        <div class="empty-state-icon">🗑️</div>
                        <p><strong>Error:</strong> ${message}</p>
                    </div>
                </div>
            `;
            container.classList.remove('hidden');
        },

        // Renderizar tarjeta de Pokémon
        /**
         * renderPokemonCard: generador de plantilla para la tarjeta principal del Pokémon.
         * Incluye imagen, tipos, habilidades, stats y contenedor de evolución.
         */
        renderPokemonCard(pokemon, fromCache = false) {
            const types = pokemon.types.map(t => t.type.name);
            const abilities = pokemon.abilities;
            const stats = pokemon.stats;
            const isFav = StorageManager.isFavorite(pokemon.id);

            const typesHTML = types.map(type => 
                `<span class="type-badge type-${type}">${type.toUpperCase()}</span>`
            ).join('');

            const abilitiesHTML = abilities.map(a => 
                `<span class="ability-pill ${a.is_hidden ? 'hidden-ability' : ''}" data-ability="${a.ability.name}">
                    ${a.ability.name.toUpperCase().replace('-', ' ')}${a.is_hidden ? ' (Oculta)' : ''}
                </span>`
            ).join('');

            const statNames = {
                'hp': 'HP',
                'attack': 'ATTACK',
                'defense': 'DEFENSE',
                'special-attack': 'SPECIAL-ATTACK',
                'special-defense': 'SPECIAL-DEFENSE',
                'speed': 'SPEED'
            };

            const statsHTML = stats.map(s => {
                const percentage = Math.min((s.base_stat / 255) * 100, 100);
                const statName = statNames[s.stat.name] || s.stat.name.toUpperCase();
                return `
                    <div class="stat-row">
                        <span class="stat-label">${statName}:</span>
                        <div class="stat-bar-container">
                            <div class="stat-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span class="stat-value">${s.base_stat}</span>
                    </div>
                `;
            }).join('');

            return `
                <div class="pokemon-card" data-pokemon-id="${pokemon.id}">
                    <div class="card-header">
                        <span class="card-badge">POKEMON_DATA</span>
                        <span class="data-source-badge">${fromCache ? '📦 DESDE CACHÉ' : '🌐 DESDE API'}</span>
                    </div>

                    <div class="pokemon-image-container">
                        <div class="pokemon-image-box">
                            <img src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}" alt="${pokemon.name}">
                        </div>
                    </div>

                    <h2 class="pokemon-name">#${pokemon.id} ${pokemon.name.toUpperCase()}</h2>
                    <div class="divider"></div>

                    <div class="types-container">
                        ${typesHTML}
                    </div>

                    <h3 class="section-title">HABILIDADES</h3>
                    <div class="abilities-container">
                        ${abilitiesHTML}
                    </div>

                    <div class="stats-section">
                        ${statsHTML}
                    </div>

                    <button class="favorite-btn ${isFav ? 'active' : ''}" data-pokemon-id="${pokemon.id}">
                        ${isFav ? '❤️' : '🤍'}
                    </button>

                    <div class="evolution-section" id="evolutionSection${pokemon.id}">
                        <h3 class="section-title">CADENA DE EVOLUCIÓN</h3>
                        <div id="evolutionChain${pokemon.id}" class="evolution-chain">
                            <div class="loading">
                                <div class="spinner"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        // Renderizar cadena evolutiva
        /**
         * renderEvolutionChain: renderiza etapas con flechas.
         * Si la siguiente etapa tiene una sola evolución se encadena en línea; múltiples evoluciones pasan a la siguiente fila.
         */
        async renderEvolutionChain(pokemon, containerId) {
            try {
                if (!pokemon.species_data || !pokemon.species_data.evolution_chain) {
                    document.getElementById(containerId).innerHTML = '<p>No hay datos de evolución disponibles.</p>';
                    return;
                }

                const evolutionData = await PokeAPI.getEvolutionChain(pokemon.species_data.evolution_chain.url);
                const stages = this.parseEvolutionChain(evolutionData.chain);
                const currentPokemonName = pokemon.name.toLowerCase();

                // Render con chaining: encadena múltiples etapas consecutivas de 1 evolución en la misma línea
                let chainHTML = '';
                for (let idx = 0; idx < stages.length; idx++) {
                    const stage = stages[idx];

                    const makeItemHTML = (evo) => {
                        const isCurrent = evo.name.toLowerCase() === currentPokemonName;
                        const currentClass = isCurrent ? ' current' : '';
                        return `
                            <div class="evolution-item${currentClass}" data-pokemon="${evo.name}">
                                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evo.id}.png" 
                                     alt="${evo.name}"
                                     onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png'">
                                <span class="evolution-name">${evo.name.toUpperCase()}</span>
                            </div>
                        `;
                    };

                    let rowHTML = stage.map(makeItemHTML).join('');
                    let chained = false;

                    // Mientras la siguiente etapa tenga solo 1 evolución, sigue encadenando en la misma línea
                    while (idx < stages.length - 1 && stages[idx + 1].length === 1) {
                        chained = true;
                        const nextEvo = stages[idx + 1][0];
                        const condition = this.formatEvolutionTrigger(nextEvo.details);
                        const conditionHTML = condition ? `<span class="evolution-condition">${condition}</span>` : '';
                        rowHTML += `<div class="evolution-arrow">→${conditionHTML}</div>` + makeItemHTML(nextEvo);
                        idx++; // Consumir etapa siguiente
                    }

                    // Si no encadenamos y hay una siguiente etapa, agrega flecha al final
                    if (idx < stages.length - 1 && !chained) {
                        // Regla: si la siguiente etapa tiene múltiples evoluciones (ramas), no mostrar condición
                        const nextStage = stages[idx + 1];
                        let conditionHTML = '';
                        if (nextStage.length === 1) {
                            // Obtener condición solo cuando hay una evolución única
                            const nextStageFirstEvo = nextStage[0];
                            const condition = this.formatEvolutionTrigger(nextStageFirstEvo.details);
                            conditionHTML = condition ? `<span class="evolution-condition">${condition}</span>` : '';
                        }
                        rowHTML += `<div class="evolution-arrow">→${conditionHTML}</div>`;
                    }

                    const rowClass = chained ? 'evolution-stage inline-next' : (stage.length === 1 ? 'evolution-stage single' : 'evolution-stage');
                    chainHTML += `<div class="${rowClass}">${rowHTML}</div>`;
                }

                document.getElementById(containerId).innerHTML = chainHTML;

                // Event listeners para las evoluciones
                document.querySelectorAll('.evolution-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const pokemonName = item.dataset.pokemon;
                        window.location.href = `index.html?search=${pokemonName}`;
                    });
                });

            } catch (error) {
                console.error('Error loading evolution chain:', error);
                document.getElementById(containerId).innerHTML = '<p>Error al cargar cadena evolutiva.</p>';
            }
        },

        parseEvolutionChain(chain) {
            const stages = [];
            
            const traverse = (node, stage = 0, details = null) => {
                if (!stages[stage]) {
                    stages[stage] = [];
                }

                const id = node.species.url.split('/').filter(Boolean).pop();
                stages[stage].push({
                    name: node.species.name,
                    id: parseInt(id),
                    details: details // Almacena detalles del disparador de evolución
                });

                if (node.evolves_to && node.evolves_to.length > 0) {
                    node.evolves_to.forEach(evo => {
                        const evoDetails = evo.evolution_details && evo.evolution_details[0];
                        traverse(evo, stage + 1, evoDetails);
                    });
                }
            };

            traverse(chain);
            return stages;
        },

        /**
         * formatEvolutionTrigger: Returns a concise condition label for evolution.
         */
        formatEvolutionTrigger(details) {
            if (!details) return '';
            
            const parts = [];
            if (details.min_level) parts.push(`Nv. ${details.min_level}`);
            if (details.item) parts.push(details.item.name.replace('-', ' ').toUpperCase());
            if (details.min_happiness) parts.push('Felicidad');
            if (details.min_affection) parts.push('Afecto');
            if (details.time_of_day) parts.push(details.time_of_day === 'day' ? 'Día' : 'Noche');
            if (details.location) parts.push(details.location.name.replace('-', ' '));
            if (details.known_move) parts.push(`Movimiento: ${details.known_move.name}`);
            if (details.trigger?.name === 'trade') parts.push('Intercambio');
            
            return parts.length > 0 ? parts.join(', ') : '';
        },

        // Renderizar tarjeta de habilidad
        renderAbilityCard(ability, fromCache = false) {
            const effect = (ability.effect_entries.find(e => e.language.name === 'es')?.effect 
                || ability.effect_entries.find(e => e.language.name === 'en')?.effect 
                || 'Descripción no disponible.');
            const pokemonList = ability.pokemon; // Mostrar lista completa

            const pokemonHTML = pokemonList.map(p => {
                const id = p.pokemon.url.split('/').filter(Boolean).pop();
                const name = p.pokemon.name;
                return `
                    <div class="pokemon-grid-item" data-pokemon="${name}">
                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" alt="${name}">
                        <span class="pokemon-grid-item-name">${name.toUpperCase()}</span>
                    </div>
                `;
            }).join('');

            return `
                <div class="ability-card">
                    <div class="card-header">
                        <span class="card-badge">HABILITY_DATA</span>
                    </div>

                    <h2 class="ability-name">✨ ${ability.name.toUpperCase().replace('-', ' ')}</h2>
                    <span class="ability-id">#${ability.id}</span>
                    <div class="divider"></div>

                    <div class="ability-effect-box">
                        <h3 class="effect-title">EFECTO</h3>
                        <p class="effect-text">${effect}</p>
                    </div>

                    <h3 class="section-title">POKÉMON CON ESTA HABILIDAD (${ability.pokemon.length})</h3>
                    <div class="pokemon-grid-scroll">
                        <div class="pokemon-grid">
                            ${pokemonHTML}
                        </div>
                    </div>
                </div>
            `;
        }
    };

    // === HANDLERS: CONTROLADOR DE INDEX.HTML ===
    // Manejadores de eventos para la página principal de búsqueda
    const IndexController = {
        // htmlElements: referencias al DOM
        // handlers: funciones de respuesta a eventos
        // utils: lógica de búsqueda y renderizado
        init() {
            const searchBtn = document.getElementById('searchBtn');
            const searchInput = document.getElementById('searchInput');
            
            if (!searchBtn || !searchInput) return;

            searchBtn.addEventListener('click', () => this.searchPokemon());
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchPokemon();
                }
            });

            // Buscar desde URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('search');
            if (searchQuery) {
                searchInput.value = searchQuery;
                this.searchPokemon();
            }
        },

        /**
         * searchPokemon: maneja búsquedas de Pokémon y de Habilidad.
         * Renderiza resultados y enlaza interacciones; actualiza histórico/caché.
         */
        async searchPokemon() {
            const searchType = document.getElementById('searchType').value;
            const searchInput = document.getElementById('searchInput').value.trim();
            const resultsContainer = document.getElementById('searchResults');

            if (!searchInput) {
                UI.showError(resultsContainer, 'Por favor ingresa un nombre o ID');
                return;
            }

            UI.showLoading(resultsContainer, 'Buscando...');

            try {
                if (searchType === 'pokemon') {
                    const result = await PokeAPI.getPokemon(searchInput);
                    const pokemon = result.data;

                    // Agregar al histórico
                    StorageManager.addToHistory({
                        id: pokemon.id,
                        name: pokemon.name,
                        sprite: pokemon.sprites.front_default,
                        types: pokemon.types
                    });

                    // Renderizar
                    resultsContainer.innerHTML = UI.renderPokemonCard(pokemon, result.fromCache);

                    // Cargar evoluciones
                    setTimeout(() => {
                        UI.renderEvolutionChain(pokemon, `evolutionChain${pokemon.id}`);
                    }, 100);

                    // Event listener para favoritos
                    const favBtn = resultsContainer.querySelector('.favorite-btn');
                    favBtn.addEventListener('click', () => {
                        const pokemonId = parseInt(favBtn.dataset.pokemonId);
                        const isFav = StorageManager.isFavorite(pokemonId);

                        if (isFav) {
                            StorageManager.removeFromFavorites(pokemonId);
                            favBtn.classList.remove('active');
                            favBtn.textContent = '🤍';
                        } else {
                            StorageManager.addToFavorites({
                                id: pokemon.id,
                                name: pokemon.name,
                                sprite: pokemon.sprites.front_default,
                                types: pokemon.types
                            });
                            favBtn.classList.add('active');
                            favBtn.textContent = '❤️';
                        }
                    });

                    // Event listeners para habilidades
                    resultsContainer.querySelectorAll('.ability-pill').forEach(pill => {
                        pill.addEventListener('click', () => {
                            const abilityName = pill.dataset.ability;
                            document.getElementById('searchType').value = 'ability';
                            document.getElementById('searchInput').value = abilityName;
                            this.searchPokemon();
                        });
                    });

                } else {
                    // Búsqueda de habilidad
                    const result = await PokeAPI.getAbility(searchInput);
                    const ability = result.data;

                    resultsContainer.innerHTML = UI.renderAbilityCard(ability, result.fromCache);

                    // Event listeners para pokémon con la habilidad
                    resultsContainer.querySelectorAll('.pokemon-grid-item').forEach(item => {
                        item.addEventListener('click', () => {
                            const pokemonName = item.dataset.pokemon;
                            window.location.href = `index.html?search=${pokemonName}`;
                        });
                    });
                }

            } catch (error) {
                console.error('Search error:', error);
                UI.showError(resultsContainer, 'No se encontró ningún resultado. Verifica el nombre o ID.');
            }
        }
    };

    // === HANDLERS: CONTROLADOR DE HISTORICO.HTML ===
    // Manejadores de eventos para la página de historial
    const HistoryController = {
        init() {
            const clearBtn = document.getElementById('clearHistoryBtn');
            
            if (!clearBtn) return;

            this.renderHistory();

            clearBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que quieres limpiar todo el histórico y caché?')) {
                    StorageManager.clearHistory();
                    StorageManager.clearCache();
                    this.renderHistory();
                }
            });
        },

        renderHistory() {
            const history = StorageManager.getHistory();
            const container = document.getElementById('historyList');
            const clearBtn = document.getElementById('clearHistoryBtn');

            if (history.length === 0) {
                container.innerHTML = `
                    <div class="pokemon-card" style="text-align: center;">
                        <div class="empty-state">
                            <div class="empty-state-icon" style="font-size: 48px; margin: 20px 0;">📜</div>
                            <p style="font-size: 18px; font-weight: bold; margin: 15px 0;">NO HAY BÚSQUEDAS EN EL HISTÓRICO</p>
                            <p style="font-size: 14px; color: #666;">Busca pokémon para que aparezcan aquí</p>
                        </div>
                    </div>
                `;
                clearBtn.classList.add('hidden');
                return;
            }
            clearBtn.classList.remove('hidden');

            const historyHTML = history.map(pokemon => {
                const types = pokemon.types?.map(t => 
                    `<span class="item-type">${t.type.name}</span>`
                ).join('') || '';

                const isFav = StorageManager.isFavorite(pokemon.id);

                return `
                    <div class="history-item" data-pokemon-name="${pokemon.name}">
                        <img src="${pokemon.sprite}" alt="${pokemon.name}">
                        <div class="item-info">
                            <div class="item-name">#${pokemon.id} ${pokemon.name.toUpperCase()}</div>
                            <div class="item-types">${types}</div>
                        </div>
                        <div class="item-actions">
                            <button class="btn-icon favorite ${isFav ? 'active' : ''}" data-action="favorite" data-pokemon-id="${pokemon.id}">
                                ${isFav ? '❤️' : '🤍'}
                            </button>
                            <button class="btn-icon delete" data-action="delete" data-pokemon-id="${pokemon.id}">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = historyHTML;

            // Event listeners para botones
            container.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    const pokemonId = parseInt(btn.dataset.pokemonId);

                    if (action === 'delete') {
                        StorageManager.removeFromHistory(pokemonId);
                        this.renderHistory();
                    } else if (action === 'favorite') {
                        const pokemon = history.find(p => p.id === pokemonId);
                        if (StorageManager.isFavorite(pokemonId)) {
                            StorageManager.removeFromFavorites(pokemonId);
                        } else {
                            StorageManager.addToFavorites(pokemon);
                        }
                        this.renderHistory();
                    }
                });
            });

            // Click en el item para ver el Pokémon
            container.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', () => {
                    const name = item.dataset.pokemonName;
                    window.location.href = `index.html?search=${name}`;
                });
            });
        }
    };

    // === HANDLERS: CONTROLADOR DE FAVORITOS.HTML ===
    // Manejadores de eventos para la página de favoritos
    const FavoritesController = {
        init() {
            const clearBtn = document.getElementById('clearFavoritesBtn');
            
            if (!clearBtn) return;

            this.renderFavorites();

            clearBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que quieres eliminar todos los favoritos?')) {
                    StorageManager.clearFavorites();
                    this.renderFavorites();
                }
            });
        },

        renderFavorites() {
            const favorites = StorageManager.getFavorites();
            const container = document.getElementById('favoritesList');
            const clearBtn = document.getElementById('clearFavoritesBtn');

            if (favorites.length === 0) {
                container.innerHTML = `
                    <div class="pokemon-card" style="text-align: center;">
                        <div class="empty-state">
                            <div class="empty-state-icon" style="font-size: 48px; margin: 20px 0;">❤️</div>
                            <p style="font-size: 18px; font-weight: bold; margin: 15px 0;">NO TIENES POKÉMONES FAVORITOS</p>
                            <p style="font-size: 14px; color: #666;">Busca un pokémon y márcalo como favorito</p>
                        </div>
                    </div>
                `;
                clearBtn.classList.add('hidden');
                return;
            }

            clearBtn.classList.remove('hidden');

            const favoritesHTML = favorites.map(pokemon => {
                const types = pokemon.types?.map(t => 
                    `<span class="item-type">${t.type.name}</span>`
                ).join('') || '';

                return `
                    <div class="favorite-item" data-pokemon-name="${pokemon.name}">
                        <img src="${pokemon.sprite}" alt="${pokemon.name}">
                        <div class="item-info">
                            <div class="item-name">#${pokemon.id} ${pokemon.name.toUpperCase()}</div>
                            <div class="item-types">${types}</div>
                        </div>
                        <div class="item-actions">
                            <button class="btn-icon delete" data-action="remove" data-pokemon-id="${pokemon.id}">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = favoritesHTML;

            // Event listeners
            container.querySelectorAll('[data-action="remove"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const pokemonId = parseInt(btn.dataset.pokemonId);
                    StorageManager.removeFromFavorites(pokemonId);
                    this.renderFavorites();
                });
            });

            // Click en el item para ver el Pokémon
            container.querySelectorAll('.favorite-item').forEach(item => {
                item.addEventListener('click', () => {
                    const name = item.dataset.pokemonName;
                    window.location.href = `index.html?search=${name}`;
                });
            });
        }
    };

    // === HANDLERS: CONTROLADOR DE VS.HTML ===
    // Manejadores de eventos para la página de batalla VS
    const VSController = {
        currentVsPokemon: { 1: null, 2: null },

        init() {
            const battleBtn = document.getElementById('battleBtn');
            
            if (!battleBtn) return;

            document.querySelectorAll('.btn-search-vs').forEach(btn => {
                btn.addEventListener('click', () => {
                    const target = btn.dataset.target;
                    const input = document.getElementById(`vsInput${target}`);
                    this.searchVsPokemon(input.value, target);
                });
            });

            // Soporte tecla Enter
            document.querySelectorAll('.search-input-vs').forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const target = input.id.includes('1') ? '1' : '2';
                        this.searchVsPokemon(input.value, target);
                    }
                });
            });

            // Estado inicial: botón deshabilitado, placeholders visibles
            battleBtn.disabled = true;
            battleBtn.classList.add('disabled');
            const resultsDivInit = document.getElementById('battleResults');
            if (resultsDivInit) {
                resultsDivInit.innerHTML = '';
                resultsDivInit.classList.add('hidden');
            }
            this.renderVsCards();

            battleBtn.addEventListener('click', () => {
                this.executeBattle();
            });
        },

        async searchVsPokemon(query, target) {
            if (!query.trim()) return;

            const battleBtn = document.getElementById('battleBtn');
            const resultsDiv = document.getElementById('battleResults');

            try {
                const result = await PokeAPI.getPokemon(query);
                const pokemon = result.data;
                
                // Guardar pokemon y origen de datos
                this.currentVsPokemon[target] = {
                    pokemon: pokemon,
                    fromCache: result.fromCache
                };

                // Agregar al histórico igual que en la búsqueda principal
                StorageManager.addToHistory({
                    id: pokemon.id,
                    name: pokemon.name,
                    sprite: pokemon.sprites.front_default,
                    types: pokemon.types
                });

                // Renderizar VS cards
                this.renderVsCards();

                // Habilitar/Deshabilitar botón de batalla según selección
                if (this.currentVsPokemon[1] && this.currentVsPokemon[2]) {
                    battleBtn.disabled = false;
                    battleBtn.classList.remove('disabled');
                } else {
                    battleBtn.disabled = true;
                    battleBtn.classList.add('disabled');
                }

                resultsDiv.classList.add('hidden');

            } catch (error) {
                alert('Pokémon no encontrado');
            }
        },

        renderVsCards() {
            const container = document.getElementById('vsCards');
            const p1 = this.currentVsPokemon[1];
            const p2 = this.currentVsPokemon[2];

            const card1 = p1 ? this.createVsCard(p1.pokemon, p1.fromCache) : this.createVsPlaceholder();
            const card2 = p2 ? this.createVsCard(p2.pokemon, p2.fromCache) : this.createVsPlaceholder();

            container.innerHTML = `
                ${card1}
                <div class="vs-divider">⚔️</div>
                ${card2}
            `;

            // Listeners para favoritos en VS
            container.querySelectorAll('.fav-vs-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const pokemonId = parseInt(btn.dataset.pokemonId);
                    const allPkm = [this.currentVsPokemon[1]?.pokemon, this.currentVsPokemon[2]?.pokemon].filter(Boolean);
                    const pokemon = allPkm.find(p => p.id === pokemonId);
                    if (!pokemon) return;

                    const isFav = StorageManager.isFavorite(pokemonId);
                    if (isFav) {
                        StorageManager.removeFromFavorites(pokemonId);
                        btn.classList.remove('active');
                        btn.textContent = '🤍';
                    } else {
                        StorageManager.addToFavorites({
                            id: pokemon.id,
                            name: pokemon.name,
                            sprite: pokemon.sprites.front_default,
                            types: pokemon.types
                        });
                        btn.classList.add('active');
                        btn.textContent = '❤️';
                    }
                });
            });
        },

        createVsPlaceholder() {
            return `
                <div class="vs-pokemon-card vs-placeholder">
                    <div class="vs-placeholder-icon">?</div>
                </div>
            `;
        },

        createVsCard(pokemon, fromCache) {
            const types = pokemon.types.map(t => 
                `<span class="type-badge type-${t.type.name}">${t.type.name.toUpperCase()}</span>`
            ).join('');

            return `
                <div class="vs-pokemon-card">
                    <span class="data-source-badge" style="position: absolute; top: 10px; left: 10px; right: auto; z-index: 10;">${fromCache ? '📦 CACHÉ' : '🌐 API'}</span>
                    <img src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}" alt="${pokemon.name}" style="width: 96px; height: 96px;">
                    <h3 class="vs-pokemon-name">#${pokemon.id} ${pokemon.name.toUpperCase()}</h3>
                    <div class="types-container" style="justify-content: center; margin: 10px 0 0;">
                        ${types}
                    </div>
                    <button class="btn-icon fav-vs-btn ${StorageManager.isFavorite(pokemon.id) ? 'active' : ''}" data-pokemon-id="${pokemon.id}" title="Favorito" style="display:block; margin:12px auto 0;">${StorageManager.isFavorite(pokemon.id) ? '❤️' : '🤍'}</button>
                </div>
            `;
        },

        /**
         * executeBattle: oculta tarjetas VS, calcula puntajes y renderiza resultados.
         */
        executeBattle() {
            const p1Data = this.currentVsPokemon[1];
            const p2Data = this.currentVsPokemon[2];

            if (!p1Data || !p2Data) return;

            const p1 = p1Data.pokemon;
            const p2 = p2Data.pokemon;

            // Ocultar las tarjetas VS y limpiar battleResults al ejecutar la batalla
            const vsCardsContainer = document.getElementById('vsCards');
            const battleResultsContainer = document.getElementById('battleResults');
            
            if (vsCardsContainer) {
                vsCardsContainer.classList.add('hidden');
            }
            
            if (battleResultsContainer) {
                battleResultsContainer.innerHTML = ''; // Limpiar contenido previo
            }

            // Calcular estadísticas totales
            const p1Stats = p1.stats.reduce((sum, s) => sum + s.base_stat, 0);
            const p2Stats = p2.stats.reduce((sum, s) => sum + s.base_stat, 0);

            // Calcular efectividad de tipos
            const p1Types = p1.types.map(t => t.type.name);
            const p2Types = p2.types.map(t => t.type.name);

            const p1Multiplier = this.calculateTypeEffectiveness(p1Types, p2Types);
            const p2Multiplier = this.calculateTypeEffectiveness(p2Types, p1Types);

            // Calcular puntuación final
            const p1Score = p1Stats * p1Multiplier;
            const p2Score = p2Stats * p2Multiplier;

            const winner = p1Score > p2Score ? p1 : p2;
            const loser = p1Score > p2Score ? p2 : p1;

            // Renderizar resultados
            this.renderBattleResults(p1, p2, winner, loser, p1Score, p2Score, p1Multiplier, p2Multiplier, p1Data.fromCache, p2Data.fromCache);
        },

        calculateTypeEffectiveness(attackTypes, defenseTypes) {
            const effectiveness = {
                fire: { grass: 2, ice: 2, bug: 2, steel: 2, water: 0.5, fire: 0.5, rock: 0.5, dragon: 0.5 },
                water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
                grass: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
                electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0 },
                ice: { grass: 2, ground: 2, flying: 2, dragon: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
                fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 },
                poison: { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
                ground: { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
                flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
                psychic: { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
                bug: { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
                rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
                ghost: { psychic: 2, ghost: 2, dark: 0.5, normal: 0 },
                dragon: { dragon: 2, steel: 0.5, fairy: 0 },
                dark: { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
                steel: { ice: 2, rock: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
                fairy: { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 }
            };

            let multiplier = 1;
            attackTypes.forEach(atkType => {
                defenseTypes.forEach(defType => {
                    if (effectiveness[atkType] && effectiveness[atkType][defType] !== undefined) {
                        multiplier *= effectiveness[atkType][defType];
                    }
                });
            });

            return multiplier;
        },

        /**
         * renderBattleResults: construye tarjetas de ganador/perdedor y secciones de análisis.
         * Incluye ventajas de tipo, comparación de stats y detalles del puntaje.
         */
        renderBattleResults(p1, p2, winner, loser, p1Score, p2Score, p1Multi, p2Multi, p1FromCache, p2FromCache) {
            const container = document.getElementById('battleResults');

            const typeAdvantages = [];
            if (p1Multi !== 1 || p2Multi !== 1) {
                if (p1Multi > 1) {
                    typeAdvantages.push({
                        attacker: p1.name,
                        defender: p2.name,
                        multiplier: p1Multi,
                        advantage: true,
                        message: '- Tipos son efectivos'
                    });
                } else if (p1Multi < 1 && p1Multi !== 0) {
                    typeAdvantages.push({
                        attacker: p1.name,
                        defender: p2.name,
                        multiplier: p1Multi,
                        advantage: false,
                        message: '- Tipos no son muy efectivos'
                    });
                }

                if (p2Multi > 1) {
                    typeAdvantages.push({
                        attacker: p2.name,
                        defender: p1.name,
                        multiplier: p2Multi,
                        advantage: true,
                        message: '- Tipos son efectivos'
                    });
                } else if (p2Multi < 1 && p2Multi !== 0) {
                    typeAdvantages.push({
                        attacker: p2.name,
                        defender: p1.name,
                        multiplier: p2Multi,
                        advantage: false,
                        message: '- Tipos no son muy efectivos'
                    });
                }
            }

            const advantagesHTML = typeAdvantages.length > 0 ? typeAdvantages.map(adv => `
                <div class="effectiveness-row ${adv.advantage ? 'advantage' : 'disadvantage'}">
                    <strong>${adv.attacker.toUpperCase()}</strong> vs <strong>${adv.defender.toUpperCase()}: ×${adv.multiplier.toFixed(2)}</strong> ${adv.message}
                </div>
            `).join('') : '<p style="text-align: center; padding: 15px;">Sin ventajas de tipo significativas.</p>';

            // Comparación de stats
            const statNames = {
                'hp': 'HP',
                'attack': 'ATK',
                'defense': 'DEF',
                'special-attack': 'SP.ATK',
                'special-defense': 'SP.DEF',
                'speed': 'SPD'
            };
            
            const stats = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
            const statsHTML = stats.map(statName => {
                const p1Stat = p1.stats.find(s => s.stat.name === statName).base_stat;
                const p2Stat = p2.stats.find(s => s.stat.name === statName).base_stat;
                const maxStat = Math.max(p1Stat, p2Stat);
                const p1Percent = (p1Stat / maxStat) * 50;
                const p2Percent = (p2Stat / maxStat) * 50;
                const displayName = statNames[statName] || statName.toUpperCase();
                const p1IsHigher = p1Stat > p2Stat;
                const p2IsHigher = p2Stat > p1Stat;

                return `
                    <div class="comparison-row">
                        <span class="comparison-value-left ${p1IsHigher ? 'higher-stat' : ''}">${p1Stat}</span>
                        <span class="comparison-label">${displayName}</span>
                        <div class="comparison-bar-container">
                            <div class="comparison-bar-left" style="width: ${p1Percent}%"></div>
                            <div class="comparison-bar-right" style="width: ${p2Percent}%"></div>
                        </div>
                        <span class="comparison-value-right ${p2IsHigher ? 'higher-stat' : ''}">${p2Stat}</span>
                    </div>
                `;
            }).join('');

            // Crear tarjetas de pokemon
            const createBattleCard = (pokemon, isWinner, score, fromCache) => {
                const isFav = StorageManager.isFavorite(pokemon.id);
                const types = pokemon.types.map(t => 
                    `<span class="type-badge type-${t.type.name}">${t.type.name.toUpperCase()}</span>`
                ).join('');

                return `
                    <div class="battle-pokemon-card ${isWinner ? 'winner' : 'loser'}">
                        ${isWinner ? '<div class="winner-badge">🏆 GANADOR</div>' : ''}
                        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
                        <h3 class="battle-pokemon-name">${pokemon.name.toUpperCase()}</h3>
                        <div class="battle-types-container">
                            ${types}
                        </div>
                        <div class="battle-divider"></div>
                        <div class="battle-score ${isWinner ? 'winner-score' : 'loser-score'}">${Math.round(score)} pts</div>
                        <button class="btn-icon fav-battle-btn ${isFav ? 'active' : ''}" data-pokemon-id="${pokemon.id}" data-pokemon-name="${pokemon.name}" title="Favorito">${isFav ? '❤️' : '🤍'}</button>
                    </div>
                `;
            };

            container.innerHTML = `
                <div class="battle-results">
                    <h2 class="battle-title">⚔️ RESULTADO DE LA BATALLA ⚔️</h2>
                    <div class="battle-divider-line"></div>
                    
                    <div class="battle-comparison">
                        ${createBattleCard(p1, winner.id === p1.id, p1Score, p1FromCache)}
                        <div class="battle-vs-icon">VS</div>
                        ${createBattleCard(p2, winner.id === p2.id, p2Score, p2FromCache)}
                    </div>

                    <div class="battle-divider-line"></div>
                    <h3 class="battle-section-title">📊 ANÁLISIS DE BATALLA</h3>

                    <div class="battle-analysis-section">
                        <div class="analysis-section-header">
                            <span class="analysis-icon">⚡</span>
                            <span class="analysis-section-label">VENTAJAS DE TIPO</span>
                        </div>
                        <div class="type-effectiveness">
                            ${advantagesHTML}
                        </div>
                    </div>

                    <div class="battle-analysis-section">
                        <div class="analysis-section-header">
                            <span class="analysis-icon">📈</span>
                            <span class="analysis-section-label">COMPARACIÓN DE STATS</span>
                        </div>
                        <div class="stats-comparison">
                            ${statsHTML}
                        </div>
                    </div>

                    <div class="battle-analysis-section">
                        <div class="analysis-section-header">
                            <span class="analysis-icon">🧮</span>
                            <span class="analysis-section-label">CÁLCULO DEL PUNTAJE</span>
                        </div>
                        <div class="score-details">
                            <strong>Stats Base Total:</strong> ${p1.name}: ${p1.stats.reduce((sum, s) => sum + s.base_stat, 0)} | ${p2.name}: ${p2.stats.reduce((sum, s) => sum + s.base_stat, 0)}<br>
                            <strong>Multiplicador de Tipo:</strong> ${p1.name}: ×${p1Multi.toFixed(2)} | ${p2.name}: ×${p2Multi.toFixed(2)}<br>
                            <strong>Puntaje Final:</strong> ${p1.name}: ${Math.round(p1Score)} | ${p2.name}: ${Math.round(p2Score)}
                        </div>
                    </div>
                </div>
            `;

            container.classList.remove('hidden');

            // Event listeners para botones de favorito en resultado batalla
            container.querySelectorAll('.fav-battle-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pokemonId = parseInt(btn.dataset.pokemonId);
                    const pokemonName = btn.dataset.pokemonName;
                    const pokemon = [p1, p2].find(p => p.id === pokemonId);
                    if (!pokemon) return;

                    const isFav = StorageManager.isFavorite(pokemonId);
                    if (isFav) {
                        StorageManager.removeFromFavorites(pokemonId);
                        btn.classList.remove('active');
                        btn.textContent = '🤍';
                    } else {
                        StorageManager.addToFavorites({
                            id: pokemon.id,
                            name: pokemon.name,
                            sprite: pokemon.sprites.front_default,
                            types: pokemon.types
                        });
                        btn.classList.add('active');
                        btn.textContent = '❤️';
                    }
                });
            });
        }
    };

    // === APP PRINCIPAL (SIGUIENDO PATRÓN IIFE DEL CURSO) ===
    const App = (() => {
        // Retornar API pública
        return {
            init() {
                const path = window.location.pathname;
                const page = path.substring(path.lastIndexOf('/') + 1);

                // Inicializar controlador según la página actual
                switch (page) {
                    case 'index.html':
                    case '':
                        IndexController.init();
                        break;
                    case 'historico.html':
                        HistoryController.init();
                        break;
                    case 'favoritos.html':
                        FavoritesController.init();
                        break;
                    case 'vs.html':
                        VSController.init();
                        break;
                    default:
                        console.warn('Página no reconocida:', page);
                }
            }
        };
    })();

    // === INICIALIZACIÓN AUTOMÁTICA ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }

})();
