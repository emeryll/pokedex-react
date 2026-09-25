import React, { useState, useEffect, useMemo } from "react";

// Type color mapping for Pokemon badges
const TYPE_COLORS = {
  normal: { bg: "#A8A77A", text: "#FFFFFF" },
  fire: { bg: "#EE8130", text: "#FFFFFF" },
  water: { bg: "#6390F0", text: "#FFFFFF" },
  electric: { bg: "#F7D02C", text: "#000000" },
  grass: { bg: "#7AC74C", text: "#FFFFFF" },
  ice: { bg: "#96D9D6", text: "#000000" },
  fighting: { bg: "#C22E28", text: "#FFFFFF" },
  poison: { bg: "#A33EA1", text: "#FFFFFF" },
  ground: { bg: "#E2BF65", text: "#000000" },
  flying: { bg: "#A98FF3", text: "#FFFFFF" },
  psychic: { bg: "#F95587", text: "#FFFFFF" },
  bug: { bg: "#A6B91A", text: "#FFFFFF" },
  rock: { bg: "#B6A136", text: "#FFFFFF" },
  ghost: { bg: "#735797", text: "#FFFFFF" },
  dragon: { bg: "#6F35FC", text: "#FFFFFF" },
  steel: { bg: "#B7B7CE", text: "#000000" },
  fairy: { bg: "#D685AD", text: "#FFFFFF" },
  dark: { bg: "#705746", text: "#FFFFFF" },
};

const PAGE_SIZE = 24;

export default function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchingApi, setSearchingApi] = useState(false);
  const [apiSearchResult, setApiSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Fetch Pokemon in batches and append them
  useEffect(() => {
    const fetchPokemonBatch = async () => {
      if (offset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon?limit=${PAGE_SIZE}&offset=${offset}`,
        );
        const data = await res.json();
        setTotalCount(data.count);

        // Fetch details for the newly paginated batch
        const detailedPromises = data.results.map((p) =>
          fetch(p.url).then((res) => res.json()),
        );
        const newDetailedData = await Promise.all(detailedPromises);

        // Append new batch to existing list
        setPokemonList((prev) => [...prev, ...newDetailedData]);
      } catch (err) {
        console.error("Failed to fetch Pokémon catalog", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchPokemonBatch();
  }, [offset]);

  const handleLoadMore = () => {
    setOffset((prevOffset) => prevOffset + PAGE_SIZE);
  };

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setApiSearchResult(null);
      setSearchError(null);
      setSearchingApi(false);
      return;
    }

    // Check if query matches local loaded list first
    const existsLocally = pokemonList.some(
      (p) => p.name.toLowerCase().includes(query) || p.id.toString() === query,
    );

    if (existsLocally) {
      setApiSearchResult(null);
      setSearchError(null);
      return;
    }

    // Otherwise, attempt single search call to PokéAPI
    const timer = setTimeout(async () => {
      setSearchingApi(true);
      setSearchError(null);
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
        if (!res.ok) throw new Error("Pokémon not found");
        const data = await res.json();
        setApiSearchResult(data);
      } catch (err) {
        setSearchError("No Pokémon found with that name or ID");
        setApiSearchResult(null);
      } finally {
        setSearchingApi(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, pokemonList]);

  const filteredCatalog = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return pokemonList;

    return pokemonList.filter(
      (p) => p.name.toLowerCase().includes(query) || p.id.toString() === query,
    );
  }, [pokemonList, searchQuery]);

  const displayedList = apiSearchResult ? [apiSearchResult] : filteredCatalog;

  const openModal = (pokemon) => {
    setSelectedPokemon(pokemon);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPokemon(null);
  };

  return (
    <div style={styles.container}>
      {/* Header Bar */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoContainer}>
            <div style={styles.pokeballIcon}>
              <div style={styles.pokeballInner} />
            </div>
            <h1 style={styles.title}>Pokédex</h1>
          </div>

          {/* Search Box */}
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search by name or ID (e.g. Charizard, 25)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={styles.clearBtn}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={{ color: "#9CA3AF", marginTop: "1rem" }}>
              Loading Pokédex Catalogue...
            </p>
          </div>
        ) : searchError ? (
          <div style={styles.emptyContainer}>
            <p style={{ fontSize: "1.25rem", color: "#F87171" }}>
              {searchError}
            </p>
            <button onClick={() => setSearchQuery("")} style={styles.resetBtn}>
              Show All Pokémon
            </button>
          </div>
        ) : (
          <>
            {/* Catalog Info Header */}
            <div style={styles.catalogInfo}>
              <p style={{ color: "#9CA3AF", fontSize: "0.9rem" }}>
                Showing {displayedList.length} of{" "}
                {totalCount || displayedList.length} Pokémon
              </p>
            </div>

            {/* Catalogue Grid */}
            <div style={styles.grid}>
              {displayedList.map((pokemon) => {
                const artwork =
                  pokemon.sprites.other?.["official-artwork"]?.front_default ||
                  pokemon.sprites.front_default;
                const formattedId = `#${String(pokemon.id).padStart(3, "0")}`;

                return (
                  <div
                    key={pokemon.id}
                    onClick={() => openModal(pokemon)}
                    style={styles.card}
                    className="pokedex-card"
                  >
                    <span style={styles.cardId}>{formattedId}</span>
                    <div style={styles.imageContainer}>
                      <img
                        src={artwork}
                        alt={pokemon.name}
                        style={styles.cardImage}
                        loading="lazy"
                      />
                    </div>
                    <h2 style={styles.cardName}>{pokemon.name}</h2>

                    {/* Type Badges */}
                    <div style={styles.typeBadgeContainer}>
                      {pokemon.types.map((t) => {
                        const typeName = t.type.name;
                        const colors = TYPE_COLORS[typeName] || {
                          bg: "#777",
                          text: "#FFF",
                        };
                        return (
                          <span
                            key={typeName}
                            style={{
                              ...styles.typeBadge,
                              backgroundColor: colors.bg,
                              color: colors.text,
                            }}
                          >
                            {typeName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {!searchQuery && pokemonList.length < totalCount && (
              <div style={styles.loadMoreWrapper}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={styles.loadMoreBtn}
                >
                  {loadingMore ? "Loading..." : "Load More Pokémon"}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Detail Modal */}
      {isModalOpen && selectedPokemon && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeModalBtn} onClick={closeModal}>
              ✕
            </button>

            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <span style={styles.modalId}>
                #{String(selectedPokemon.id).padStart(3, "0")}
              </span>
              <h2 style={styles.modalTitle}>{selectedPokemon.name}</h2>
              <div style={styles.typeBadgeContainer}>
                {selectedPokemon.types.map((t) => {
                  const typeName = t.type.name;
                  const colors = TYPE_COLORS[typeName] || {
                    bg: "#777",
                    text: "#FFF",
                  };
                  return (
                    <span
                      key={typeName}
                      style={{
                        ...styles.typeBadge,
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {typeName}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Modal Body */}
            <div style={styles.modalBody}>
              {/* Image & Measurements */}
              <div style={styles.modalLeftColumn}>
                <img
                  src={
                    selectedPokemon.sprites.other?.["official-artwork"]
                      ?.front_default || selectedPokemon.sprites.front_default
                  }
                  alt={selectedPokemon.name}
                  style={styles.modalImage}
                />
                <div style={styles.infoBox}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Height</span>
                    <span style={styles.infoValue}>
                      {(selectedPokemon.height / 10).toFixed(1)} m
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Weight</span>
                    <span style={styles.infoValue}>
                      {(selectedPokemon.weight / 10).toFixed(1)} kg
                    </span>
                  </div>
                </div>

                {/* Abilities */}
                <div
                  style={{
                    marginTop: "1rem",
                    textAlign: "center",
                    width: "100%",
                  }}
                >
                  <span style={styles.infoLabel}>Abilities</span>
                  <div style={styles.abilitiesList}>
                    {selectedPokemon.abilities.map((a) => (
                      <span key={a.ability.name} style={styles.abilityBadge}>
                        {a.ability.name.replace("-", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Base Stats */}
              <div style={styles.modalRightColumn}>
                <h3 style={styles.statsHeading}>Base Stats</h3>
                <div style={styles.statsList}>
                  {selectedPokemon.stats.map((s) => {
                    const statValue = s.base_stat;
                    const maxStat = 255;
                    const percentage = Math.min(
                      (statValue / maxStat) * 100 * 2,
                      100,
                    );

                    return (
                      <div key={s.stat.name} style={styles.statRow}>
                        <span style={styles.statName}>
                          {formatStatName(s.stat.name)}
                        </span>
                        <span style={styles.statVal}>{statValue}</span>
                        <div style={styles.statTrack}>
                          <div
                            style={{
                              ...styles.statFill,
                              width: `${percentage}%`,
                              backgroundColor: getStatColor(statValue),
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Animations and Card Hover Effects */}
      <style>{`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #0F172A;
          color: #F8FAFC;
        }
        .pokedex-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .pokedex-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px -10px rgba(59, 130, 246, 0.3);
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function formatStatName(name) {
  switch (name) {
    case "hp":
      return "HP";
    case "attack":
      return "Atk";
    case "defense":
      return "Def";
    case "special-attack":
      return "Sp. Atk";
    case "special-defense":
      return "Sp. Def";
    case "speed":
      return "Spd";
    default:
      return name;
  }
}

function getStatColor(value) {
  if (value < 50) return "#EF4444";
  if (value < 80) return "#F59E0B";
  if (value < 110) return "#10B981";
  return "#3B82F6";
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0F172A",
    color: "#F8FAFC",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#1E293B",
    borderBottom: "1px solid #334155",
    position: "sticky",
    top: 0,
    zIndex: 10,
    padding: "1rem 1.5rem",
  },
  headerInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifySpaceBetween: "space-between",
    gap: "1rem",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  pokeballIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(to bottom, #EF4444 50%, #FFFFFF 50%)",
    border: "3px solid #0F172A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 10px rgba(239, 68, 68, 0.4)",
  },
  pokeballInner: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#0F172A",
    border: "2px solid #FFFFFF",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "700",
    letterSpacing: "0.05em",
    background: "linear-gradient(90deg, #3B82F6, #60A5FA)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    minWidth: "280px",
    flex: 1,
    maxWidth: "400px",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    fontSize: "0.9rem",
    color: "#9CA3AF",
  },
  searchInput: {
    width: "100%",
    padding: "0.6rem 2.2rem 0.6rem 2.2rem",
    backgroundColor: "#0F172A",
    border: "1px solid #334155",
    borderRadius: "9999px",
    color: "#F8FAFC",
    fontSize: "0.9rem",
    outline: "none",
  },
  clearBtn: {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    color: "#9CA3AF",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  mainContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem 1.5rem",
    width: "100%",
    boxSizing: "border-box",
    flex: 1,
  },
  catalogInfo: {
    marginBottom: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "1.25rem",
  },
  card: {
    backgroundColor: "#1E293B",
    border: "1px solid #334155",
    borderRadius: "1rem",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    position: "relative",
  },
  cardId: {
    position: "absolute",
    top: "12px",
    right: "14px",
    fontSize: "0.8rem",
    fontWeight: "700",
    color: "#64748B",
  },
  imageContainer: {
    width: "120px",
    height: "120px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0.5rem 0",
  },
  cardImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  },
  cardName: {
    margin: "0.5rem 0",
    fontSize: "1.1rem",
    fontWeight: "600",
    textTransform: "capitalize",
    color: "#F8FAFC",
  },
  typeBadgeContainer: {
    display: "flex",
    gap: "0.4rem",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  typeBadge: {
    fontSize: "0.7rem",
    fontWeight: "700",
    textTransform: "uppercase",
    padding: "0.2rem 0.6rem",
    borderRadius: "9999px",
    letterSpacing: "0.05em",
  },
  loadMoreWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: "2.5rem",
  },
  loadMoreBtn: {
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    border: "none",
    padding: "0.75rem 2rem",
    borderRadius: "9999px",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem 0",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #334155",
    borderTop: "4px solid #3B82F6",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  emptyContainer: {
    textAlign: "center",
    padding: "3rem 0",
  },
  resetBtn: {
    marginTop: "1rem",
    backgroundColor: "#334155",
    color: "#FFF",
    border: "none",
    padding: "0.5rem 1.25rem",
    borderRadius: "0.5rem",
    cursor: "pointer",
  },
  /* Modal Styles */
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: "1rem",
  },
  modalContent: {
    backgroundColor: "#1E293B",
    border: "1px solid #334155",
    borderRadius: "1.5rem",
    width: "100%",
    maxWidth: "550px",
    padding: "2rem",
    position: "relative",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
  },
  closeModalBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "none",
    border: "none",
    color: "#9CA3AF",
    fontSize: "1.25rem",
    cursor: "pointer",
  },
  modalHeader: {
    textAlign: "center",
    marginBottom: "1.5rem",
  },
  modalId: {
    fontSize: "0.9rem",
    fontWeight: "700",
    color: "#64748B",
  },
  modalTitle: {
    margin: "0.25rem 0 0.5rem 0",
    fontSize: "1.75rem",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  modalBody: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
    alignItems: "center",
  },
  modalLeftColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  modalImage: {
    width: "160px",
    height: "160px",
    objectFit: "contain",
  },
  infoBox: {
    display: "flex",
    justifyContent: "space-around",
    width: "100%",
    backgroundColor: "#0F172A",
    borderRadius: "0.75rem",
    padding: "0.75rem",
    marginTop: "1rem",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: "0.75rem",
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: "0.95rem",
    fontWeight: "600",
    marginTop: "0.2rem",
  },
  abilitiesList: {
    display: "flex",
    gap: "0.4rem",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: "0.4rem",
  },
  abilityBadge: {
    fontSize: "0.75rem",
    backgroundColor: "#334155",
    color: "#E2E8F0",
    padding: "0.2rem 0.5rem",
    borderRadius: "0.375rem",
    textTransform: "capitalize",
  },
  modalRightColumn: {
    display: "flex",
    flexDirection: "column",
  },
  statsHeading: {
    margin: "0 0 1rem 0",
    fontSize: "1rem",
    color: "#CBD5E1",
  },
  statsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  statRow: {
    display: "grid",
    gridTemplateColumns: "60px 35px 1fr",
    alignItems: "center",
    gap: "0.5rem",
  },
  statName: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#9CA3AF",
  },
  statVal: {
    fontSize: "0.8rem",
    fontWeight: "700",
    textAlign: "right",
  },
  statTrack: {
    height: "6px",
    backgroundColor: "#0F172A",
    borderRadius: "9999px",
    overflow: "hidden",
  },
  statFill: {
    height: "100%",
    borderRadius: "9999px",
    transition: "width 0.4s ease-out",
  },
};
