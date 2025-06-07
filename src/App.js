import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

const MTGBinderApp = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [cards, setCards] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [ffCards, setFfCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [setCode, setSetCode] = useState("FIN");
  const [setName, setSetName] = useState("Final Fantasy");
  const [inputSetCode, setInputSetCode] = useState("FIN");

  // Fetch all cards from Scryfall API with pagination support
  const fetchCards = async (code) => {
    try {
      setLoading(true);
      setError(null);

      let allCards = [];
      let nextPageUrl = `https://api.scryfall.com/cards/search?q=set%3A${code.toLowerCase()}+include%3Aextras&order=set&unique=prints`;

      // Fetch all pages of results
      while (nextPageUrl) {
        const response = await fetch(nextPageUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.object === "error") {
          throw new Error(data.details || `No cards found for set "${code}"`);
        }

        // Add this page's cards to our collection
        allCards = [...allCards, ...data.data];

        // Check if there's a next page
        nextPageUrl = data.has_more ? data.next_page : null;

        // Add a small delay to be respectful to Scryfall's API
        if (nextPageUrl) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      console.log("Fetched cards from Scryfall:", allCards.length);

      // First, let's see what 99b actually looks like in the raw data
      const card99bRaw = allCards.find(
        (card) => card.collector_number === "99b"
      );
      if (card99bRaw) {
        console.log("RAW 99b card data:", {
          name: card99bRaw.name,
          collector_number: card99bRaw.collector_number,
          layout: card99bRaw.layout,
          card_faces: card99bRaw.card_faces ? card99bRaw.card_faces.length : 0,
          type_line: card99bRaw.type_line,
        });
      }

      // Simple, direct filtering approach
      const transformedCards = allCards
        .filter((card) => {
          const collectorNumber = card.collector_number;

          // Direct approach: filter out any card with collector number ending in 'b'
          if (collectorNumber.endsWith("b")) {
            console.log(
              `Filtering out card ending in 'b': ${collectorNumber} - ${card.name}`
            );
            return false;
          }

          // Also filter out cards ending in other letters for double-faced cards
          if (collectorNumber.match(/[c-z]$/i)) {
            console.log(
              `Filtering out card ending in letter: ${collectorNumber} - ${card.name}`
            );
            return false;
          }

          // Keep everything else
          return true;
        })
        .map((card, index) => {
          const cardData = {
            id: index + 1,
            name: card.name,
            number: card.collector_number,
            rarity: card.rarity.charAt(0).toUpperCase(),
            color:
              card.color_identity.length > 0 ? card.color_identity[0] : "C",
            type: card.type_line,
            image: card.image_uris?.normal,
            scryfallId: card.id,
            manaCost: card.mana_cost || "",
            cmc: card.cmc || 0,
            setName: card.set_name,
            layout: card.layout,
            isDoubleFaced: false,
            frameEffects: card.frame_effects || [],
            isPromo: card.promo || false,
            finish: card.finishes || [],
          };

          // Handle double-faced cards
          if (card.card_faces && card.card_faces.length > 1) {
            cardData.isDoubleFaced = true;
            if (!cardData.image && card.card_faces[0].image_uris) {
              cardData.image = card.card_faces[0].image_uris.normal;
            }
          }

          return cardData;
        })
        .sort((a, b) => {
          const aNum = parseInt(a.number) || 999999;
          const bNum = parseInt(b.number) || 999999;

          if (aNum !== bNum) {
            return aNum - bNum;
          }

          return a.number.localeCompare(b.number);
        });

      console.log("Cards after filtering:", transformedCards.length);

      // Verify 99b is gone
      const card99bFiltered = transformedCards.find((c) => c.number === "99b");
      const card99 = transformedCards.find((c) => c.number === "99");

      console.log("=== FINAL CHECK ===");
      console.log(
        "Card 99b present after filtering?",
        card99bFiltered ? "YES - PROBLEM!" : "NO - SUCCESS!"
      );
      console.log(
        "Card 99 present after filtering?",
        card99 ? "YES - " + card99.name : "NO - PROBLEM!"
      );

      if (card99bFiltered) {
        console.log("ERROR: 99b still exists:", card99bFiltered);
      }

      setFfCards(transformedCards);
      setSetName(transformedCards[0]?.setName || code.toUpperCase());
      setSetCode(code.toUpperCase());

      // Pre-fill the binder with cards in collection order (18 per page - 2 sides of 9)
      const initialCards = {};
      transformedCards.forEach((card, index) => {
        const pageIndex = Math.floor(index / 18);
        const cardIndexOnPage = index % 18;
        const side = cardIndexOnPage < 9 ? "left" : "right";
        const slotIndex = cardIndexOnPage % 9;
        const key = `${pageIndex}-${slotIndex}-${side}`;
        initialCards[key] = card.id;
      });
      setCards(initialCards);
      setCurrentPage(0);
    } catch (err) {
      console.error("Error fetching cards:", err);
      setError(err.message);

      if (ffCards.length === 0) {
        const fallbackCards = [
          {
            id: 1,
            name: "Sample Card 1",
            number: "001",
            rarity: "M",
            color: "R",
            type: "Legendary Creature",
            image: null,
            frameEffects: [],
            isPromo: false,
            finish: [],
          },
          {
            id: 2,
            name: "Sample Card 2",
            number: "002",
            rarity: "R",
            color: "U",
            type: "Creature",
            image: null,
            frameEffects: [],
            isPromo: false,
            finish: [],
          },
          {
            id: 3,
            name: "Sample Card 3",
            number: "003",
            rarity: "U",
            color: "B",
            type: "Instant",
            image: null,
            frameEffects: [],
            isPromo: false,
            finish: [],
          },
          {
            id: 4,
            name: "Sample Card 4",
            number: "004",
            rarity: "C",
            color: "G",
            type: "Sorcery",
            image: null,
            frameEffects: [],
            isPromo: false,
            finish: [],
          },
          {
            id: 5,
            name: "Sample Card 5",
            number: "005",
            rarity: "C",
            color: "W",
            type: "Enchantment",
            image: null,
            frameEffects: [],
            isPromo: false,
            finish: [],
          },
        ];
        setFfCards(fallbackCards);
        setSetName("Sample Set");

        const initialCards = {};
        fallbackCards.forEach((card, index) => {
          const pageIndex = Math.floor(index / 18);
          const cardIndexOnPage = index % 18;
          const side = cardIndexOnPage < 9 ? "left" : "right";
          const slotIndex = cardIndexOnPage % 9;
          const key = `${pageIndex}-${slotIndex}-${side}`;
          initialCards[key] = card.id;
        });
        setCards(initialCards);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load initial set on component mount
  useEffect(() => {
    fetchCards(setCode);
  }, []);

  const handleSetCodeSubmit = (e) => {
    e.preventDefault();
    if (inputSetCode.trim()) {
      fetchCards(inputSetCode.trim());
    }
  };

  const getCardVariantInfo = (card) => {
    const variants = [];

    if (card.frameEffects && card.frameEffects.includes("showcase"))
      variants.push("Showcase");
    if (card.frameEffects && card.frameEffects.includes("borderless"))
      variants.push("Borderless");
    if (card.frameEffects && card.frameEffects.includes("extendedart"))
      variants.push("Extended");
    if (card.isPromo) variants.push("Promo");
    if (
      card.finish &&
      card.finish.includes("foil") &&
      card.finish.includes("nonfoil")
    )
      variants.push("Foil");
    else if (card.finish && card.finish.includes("foil"))
      variants.push("Foil Only");

    return variants.length > 0 ? variants.join(" • ") : "";
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "M":
        return "text-orange-500";
      case "R":
        return "text-yellow-500";
      case "U":
        return "text-blue-400";
      case "C":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const getColorSymbol = (color) => {
    const colorMap = {
      W: "⚪",
      U: "🔵",
      B: "⚫",
      R: "🔴",
      G: "🟢",
      C: "⚪",
    };
    return colorMap[color] || "⚫";
  };

  const addCardToSlot = (pageIndex, slotIndex, side, cardId) => {
    const key = `${pageIndex}-${slotIndex}-${side}`;
    setCards((prev) => ({
      ...prev,
      [key]: cardId,
    }));
    setSelectedSlot(null);
  };

  const removeCardFromSlot = (pageIndex, slotIndex, side) => {
    const key = `${pageIndex}-${slotIndex}-${side}`;
    setCards((prev) => {
      const newCards = { ...prev };
      delete newCards[key];
      return newCards;
    });
  };

  const getCardInSlot = (pageIndex, slotIndex, side) => {
    const key = `${pageIndex}-${slotIndex}-${side}`;
    const cardId = cards[key];
    return ffCards.find((card) => card.id === cardId);
  };

  const filteredCards = ffCards.filter(
    (card) =>
      card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.number.includes(searchTerm)
  );

  const totalPages = Math.ceil(ffCards.length / 18);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Loading MTG Cards...</h2>
          <p className="text-blue-200">
            Fetching data from Scryfall API for set: {inputSetCode || setCode}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && ffCards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Failed to Load Cards</h2>
          <p className="text-blue-200 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const CardSlot = ({ pageIndex, slotIndex, side }) => {
    const card = getCardInSlot(pageIndex, slotIndex, side);

    return (
      <div
        className={`aspect-[5/7] border-2 rounded-lg flex items-center justify-center transition-all overflow-hidden
          ${
            card
              ? "border-blue-400 bg-blue-900"
              : "border-gray-500 border-dashed bg-gray-800"
          }`}
      >
        {card ? (
          <div className="w-full h-full relative">
            {card.image ? (
              <div className="relative w-full h-full">
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div className="hidden w-full h-full flex-col items-center justify-center text-center bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg border border-gray-600 p-2">
                  <div
                    className={`text-sm font-bold ${getRarityColor(
                      card.rarity
                    )} mb-1`}
                  >
                    {getColorSymbol(card.color)}
                  </div>
                  <div className="text-xs font-semibold text-white leading-tight mb-1">
                    {card.name}
                  </div>
                  <div className="text-xs text-gray-300 mb-1">
                    #{card.number}
                  </div>
                  <div
                    className={`text-xs font-bold ${getRarityColor(
                      card.rarity
                    )} mb-1`}
                  >
                    {card.rarity}
                  </div>
                  <div className="text-xs text-gray-400 text-center leading-tight">
                    {card.type}
                  </div>
                  {getCardVariantInfo(card) && (
                    <div className="text-xs text-yellow-300 font-semibold mt-1">
                      {getCardVariantInfo(card)}
                    </div>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2">
                  <div className="text-xs text-white font-semibold truncate">
                    {card.name}
                  </div>
                  <div className="text-xs text-gray-300">
                    #{card.number} • {card.rarity}
                    {card.isDoubleFaced ? " • DFC" : ""}
                  </div>
                  {getCardVariantInfo(card) && (
                    <div className="text-xs text-yellow-300 font-semibold">
                      {getCardVariantInfo(card)}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg border border-gray-600 p-2">
                <div
                  className={`text-sm font-bold ${getRarityColor(
                    card.rarity
                  )} mb-1`}
                >
                  {getColorSymbol(card.color)}
                </div>
                <div className="text-xs font-semibold text-white leading-tight mb-1">
                  {card.name}
                </div>
                <div className="text-xs text-gray-300 mb-1">#{card.number}</div>
                <div
                  className={`text-xs font-bold ${getRarityColor(
                    card.rarity
                  )} mb-1`}
                >
                  {card.rarity}
                </div>
                <div className="text-xs text-gray-400 text-center leading-tight">
                  {card.type}
                </div>
                {getCardVariantInfo(card) && (
                  <div className="text-xs text-yellow-300 font-semibold mt-1">
                    {getCardVariantInfo(card)}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-xs text-center">Empty Slot</div>
        )}
      </div>
    );
  };

  const CardSelector = () => {
    if (!selectedSlot) return null;

    const [pageIndex, slotIndex, side] = selectedSlot.split("-");

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">
              Select Card for Slot {parseInt(slotIndex) + 1} (
              {side === "left" ? "Left" : "Right"} Side)
            </h3>
            <button
              onClick={() => setSelectedSlot(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="overflow-y-auto max-h-60">
            <div className="grid grid-cols-2 gap-2">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="p-3 border rounded-lg hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                  onClick={() =>
                    addCardToSlot(
                      parseInt(pageIndex),
                      parseInt(slotIndex),
                      side,
                      card.id
                    )
                  }
                >
                  <div>
                    <div className="font-semibold text-sm">{card.name}</div>
                    <div className="text-xs text-gray-500">#{card.number}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">
                      {getColorSymbol(card.color)}
                    </span>
                    <span
                      className={`text-xs font-bold ${getRarityColor(
                        card.rarity
                      )}`}
                    >
                      {card.rarity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            MTG Collection Binder - For the people who cant count
          </h1>
          <p className="text-blue-200 mb-4">
            {error ? "API Error (normal in preview) - " : ""}I wanted that
            buster sword
          </p>

          <form
            onSubmit={handleSetCodeSubmit}
            className="max-w-md mx-auto mb-4"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={inputSetCode}
                onChange={(e) => setInputSetCode(e.target.value.toUpperCase())}
                placeholder="Enter set code (e.g., FIN, MH3, DMU)"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !inputSetCode.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
              >
                {loading ? "Loading..." : "Load Set"}
              </button>
            </div>
          </form>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-yellow-400">{setName}</h2>
            <p className="text-gray-300">
              Set Code: {setCode} • {ffCards.length} cards
            </p>
          </div>

          {error && (
            <div className="mt-4 px-4 py-2 bg-yellow-900/50 border border-yellow-600 rounded-lg text-yellow-200 text-sm max-w-md mx-auto">
              <strong>Preview Note:</strong> API calls don't work in Claude's
              preview. In a real environment, this will fetch actual card data
              from Scryfall.
            </div>
          )}
        </div>

        <div className="flex justify-center items-center gap-4 mb-6">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold">
              Page {currentPage + 1} of {totalPages}
            </span>
          </div>

          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
            }
            disabled={currentPage === totalPages - 1}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Next
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 shadow-2xl max-w-7xl mx-auto">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-yellow-400">
              Binder Page {currentPage + 1}
            </h2>
            <p className="text-gray-300">18 cards per page (2 sides of 9)</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-4 text-center">
                Front page
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[...Array(9)].map((_, index) => (
                  <CardSlot
                    key={`left-${index}`}
                    pageIndex={currentPage}
                    slotIndex={index}
                    side="left"
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-4 text-center">
                Back page
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[...Array(9)].map((_, index) => (
                  <CardSlot
                    key={`right-${index}`}
                    pageIndex={currentPage}
                    slotIndex={index}
                    side="right"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">
                {ffCards.length}
              </div>
              <div className="text-sm text-gray-300">Total Cards</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-400">
                {ffCards.filter((c) => c.rarity === "M").length}
              </div>
              <div className="text-sm text-gray-300">Mythic Rares</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">
                {ffCards.filter((c) => c.rarity === "R").length}
              </div>
              <div className="text-sm text-gray-300">Rares</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">
                {Math.ceil(ffCards.length / 18)}
              </div>
              <div className="text-sm text-gray-300">Pages Needed</div>
            </div>
          </div>
        </div>
      </div>

      <CardSelector />
    </div>
  );
};

export default MTGBinderApp;
