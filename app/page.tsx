"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faWeight, faRulerVertical, faStarHalfAlt, faStar, faSpinner } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css'; 
import { EvolutionChain, Pokemon } from './components/interfaces';
import { useModalAndShiny } from './components/hooks/useModalandShiny';
import { useErrorHandling } from './components/hooks/useErrorHandling';

const Main: React.FC = () => {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [filteredPokemonList, setFilteredPokemonList] = useState<Pokemon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [generationData, setGenerationData] = useState<Pokemon[][]>([]);

  const {
    isModalOpen,
    selectedPokemon,
    evolutions,
    isShiny,
    closeModal,
    toggleShiny,
    openModal,
  } = useModalAndShiny();

  const { 
    errorMessage,
    handleError,
     clearError 
  } = useErrorHandling();

  useEffect(() => {
    const loadInitialPokemon = async () => {
      const initialPokemon = await fetchPokemon();
      setPokemonList(initialPokemon);
      setFilteredPokemonList(initialPokemon);
    };
    loadInitialPokemon();
  }, []);
  
  const fetchPokemon = async (offset: number = 0) => {
    setIsLoading(true);
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon?limit=20&offset=${offset}`);
    const pokemonData = await Promise.all(
      response.data.results.map(async (pokemon: Pokemon) => {
        const pokemonDetails = await axios.get(pokemon.url);
        return {
          ...pokemon,
          imageUrl: pokemonDetails.data.sprites.other['official-artwork'].front_default,
          //If you want shiny by default use this
          // imageUrl: pokemonDetails.data.sprites.other['official-artwork'].front_shiny,
        };
      })
    );
    setIsLoading(false);
    return pokemonData;
  };

  const filterDuplicates = (list: Pokemon[]) => {
      const seen = new Set();
      return list.filter(pokemon => {
          const duplicate = seen.has(pokemon.url);
          seen.add(pokemon.url);
          return !duplicate;
      });
  };

  useEffect(() => {
    const handleScroll = async () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !isLoading) {
        setIsLoading(true);

        const newOffset = offset + 20;
        setOffset(newOffset);

        const newPokemon = await fetchPokemon(newOffset);
        setPokemonList(prevList => filterDuplicates([...prevList, ...newPokemon]));
        setFilteredPokemonList(prevList => filterDuplicates([...prevList, ...newPokemon]));
        setIsLoading(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [offset, isLoading]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = pokemonList.filter((pokemon) =>
      pokemon.name.toLowerCase().includes(query)
    );

    if (filtered.length > 0) {
      setFilteredPokemonList(filtered);
    } else {
      try {
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${query}`);
        const pokemonDetails = response.data;

        const newPokemon = {
          id: pokemonDetails.id,
          name: pokemonDetails.name,
          url: `https://pokeapi.co/api/v2/pokemon/${query}`,
          imageUrl:pokemonDetails.sprites.other['official-artwork'].front_default
        };

        setFilteredPokemonList([newPokemon]);
      } catch (error) {
        setFilteredPokemonList([]);
      }
    }
  };

  const fetchEvolutionChain = async (url: string) => {
    const response = await axios.get(url);
    const chain = response.data.chain;
    const evolutions: Pokemon[] = [];

    const addEvolutions = async (chain: EvolutionChain) => {
      const speciesResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon/${chain.species.name}`);
      evolutions.push({
        id: chain.species.id,
        name: chain.species.name,
        url: `https://pokeapi.co/api/v2/pokemon/${chain.species.name}`,
        imageUrl: speciesResponse.data.sprites.other?.home.front_default ?? speciesResponse.data.sprites.front_default,
      });

      if (chain.evolves_to.length > 0) {
        for (const next of chain.evolves_to) {
          await addEvolutions(next);
        }
      }
    };

    await addEvolutions(chain);
    return evolutions;
  };

  const handlePokemonClick = async (pokemon: Pokemon) => {
    try {
      const response = await axios.get(pokemon.url);
      const speciesResponse = await axios.get(response.data.species.url);
      const evolutionChainUrl = speciesResponse.data.evolution_chain.url;
      const evolutionData = await fetchEvolutionChain(evolutionChainUrl);
  
      openModal(response.data, evolutionData);
      clearError();
    } catch (error) {
      handleError(error, 'Failed to fetch Pokémon details. Please try again.');
    }
  };

  const fetchGenerationData = async () => {
    try {
      const allGenerationsData = await Promise.all(
        [...Array(9)].map(async (_, index) => {
          const response = await axios.get(`https://pokeapi.co/api/v2/generation/${index + 1}`);
          const pokemonSpecies = response.data.pokemon_species;
  
          const pokemonList = await Promise.all(
            pokemonSpecies.map(async (species: any) => {
              const pokemonDetails = await axios.get(species.url.replace('-species', ''));
              return {
                id: pokemonDetails.data.id,
                name: species.name,
                url: `https://pokeapi.co/api/v2/pokemon/${species.name}`,
                imageUrl: pokemonDetails.data.sprites.other['official-artwork'].front_default,
              };
            })
          );
  
          const sortedPokemonList = sortByPokemonNumber(pokemonList);
  
          return sortedPokemonList;
        })
      );
  
      setGenerationData(allGenerationsData);
    } catch (error) {
      console.error('Failed to fetch generation data:', error);
    }
  };
  

  useEffect(() => {
    fetchGenerationData();
  }, []);

  const handlePokemonSelect = async (pokemonUrl: string) => {
    try {
      const response = await axios.get(pokemonUrl);
      const pokemonDetails = response.data;

      const selectedPokemon = {
        id: pokemonDetails.id,
        name: pokemonDetails.name,
        url: pokemonUrl,
        imageUrl: pokemonDetails.sprites.other['official-artwork'].front_default,
      };

      setFilteredPokemonList([selectedPokemon]);
    } catch (error) {
      console.error('Failed to fetch Pokémon details:', error);
      setFilteredPokemonList([]);
    }
  };

  const sortByPokemonNumber = (pokemonList: Pokemon[]) => {
    return pokemonList.sort((a, b) => a.id - b.id);
  };  

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredPokemonList(pokemonList);
  };

  return (
    <div className="min-h-screen bg-gray-500 p-4">

      <div className="max-w-2xl mx-auto">
        {errorMessage && (
          <div role="alert" className='mb-4'>
            <div className="bg-red-500 text-white font-bold rounded-t px-4 py-2">
              Error
            </div>
            <div className="border border-t-0 border-red-400 rounded-b bg-red-100 px-4 py-3 text-red-700">
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={handleSearch}
            className="w-full p-3 pl-10 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-4">
          {generationData.map((generation, genIndex) => (
            <select
              key={genIndex}
              className="bg-gray-800 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              onChange={(e) => handlePokemonSelect(e.target.value)}
            >
              {generation.map((pokemon, index) => (
                <option key={index} value={pokemon.url}>
                  {`${ pokemon.id +' '+ pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}`}
                </option>
              ))}
            </select>
          ))}
        </div>

        <div className="flex items-center justify-center mb-4">
          <button onClick={handleClearSearch} className="ml-2 p-2 w-3/4 bg-green-500 text-white rounded hover:bg-green-700">
              Clear
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {filteredPokemonList.map((pokemon, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-700"
              onClick={() => handlePokemonClick(pokemon)}
              
            >
              <Image
                src={pokemon.imageUrl}
                alt={pokemon.name}
                width={100}
                height={100}
                className="mx-auto"
              />
              <h3 className="text-white mt-2">
                {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
              </h3>
              <p className="text-gray-400">
                #{pokemon.id || pokemon.url.split('/').slice(-2, -1)[0]}
              </p>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="text-center text-white mt-4">
            Loading more Pokémon...
            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-gray-500" />
          </div>
        )}
      </div>
        
      {isModalOpen && selectedPokemon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          
          <div className="relative z-10 bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="absolute -z-10 p-8 bg-cover bg-center filter blur-lg opacity-30 inset-0" 
                  style={{backgroundImage: `url(${selectedPokemon.sprites.other['official-artwork'].front_default || selectedPokemon.sprites.front_default})`
                  }}>
            </div>
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <Zoom>
                <Image
                  src={isShiny 
                    ? selectedPokemon.sprites.other['official-artwork'].front_shiny 
                    : selectedPokemon.sprites.other['official-artwork'].front_default || selectedPokemon.sprites.front_default
                  }
                  alt={selectedPokemon.name}
                  width={150}
                  height={150}
                  className="mx-auto"
                />
              </Zoom>        
              <div className="flex justify-center items-center mt-4">
                <h2 className="text-white text-2xl text-center">
                  {selectedPokemon.name.charAt(0).toUpperCase() +
                    selectedPokemon.name.slice(1)}
                </h2>
                <FontAwesomeIcon icon={isShiny ? faStar : faStarHalfAlt} 
                  onClick={toggleShiny}
                  className="ml-4 text-gray-400 hover:text-white cursor-pointer"
                />
              </div>
              <h3 className="text-gray-100 text-center mt-2">
                #{selectedPokemon.id.toString().padStart(3, '0')}
              </h3>
              <div className="flex justify-center items-center text-center mt-4 gap-6">
                <FontAwesomeIcon icon={faWeight} />
                <p className="text-white">
                  Weight
                  <span> {selectedPokemon.weight/10}kg</span>
                </p>
                <FontAwesomeIcon icon={faRulerVertical} />
                <p className="text-white">
                  Height
                  <span> {selectedPokemon.height/10}m</span>
                </p>
              </div>
              <div className="text-center mt-4">
                <p className="text-white">Type/s:</p>
                {selectedPokemon.types.map((type, index) => (
                  <span
                    key={index}
                    className="text-yellow-400 mr-2 capitalize"
                  >
                    {type.type.name}
                  </span>
                ))}
              </div>
              <div className="text-center mt-4">
                <p className="text-white">Abilities:</p>
                {selectedPokemon.abilities.map((ability, index) => (
                  <span
                    key={index}
                    className="text-yellow-400 mr-2 capitalize text-center"
                  >
                    {ability.ability.name}
                  </span>
                ))}
              </div>
              <div className="mt-6">
                <h3 className="text-white text-xl text-center mb-4">Evolutions</h3>
                <div className="flex flex-wrap justify-center space-x-4 border rounded-lg outline-inherit ring-inherit shadow-2xl opacity-100 ring-offset-slate-50 dark:ring-offset-slate-900">
                  {evolutions.map((evolution, index) => (
                    <div key={index} className="text-center flex-none m-2">
                      <Image
                        src={evolution.imageUrl}
                        alt={evolution.name}
                        width={75}
                        height={75}
                        className="mx-auto"
                      />
                      <p className="text-gray-100 mt-2 capitalize">
                        {evolution.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Main;
