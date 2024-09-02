import { useState } from 'react';
import { Pokemon, PokemonDetails } from '../interfaces';

export const useModalAndShiny = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetails | null>(null);
  const [evolutions, setEvolutions] = useState<Pokemon[]>([]);
  const [isShiny, setIsShiny] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPokemon(null);
    setEvolutions([]);
  };

  const toggleShiny = () => {
    setIsShiny(prevIsShiny => !prevIsShiny);
  };

  const openModal = (pokemonDetails: PokemonDetails, evolutions: Pokemon[]) => {
    setSelectedPokemon(pokemonDetails);
    setEvolutions(evolutions);
    setIsModalOpen(true);
  };

  return {
    isModalOpen,
    selectedPokemon,
    evolutions,
    isShiny,
    closeModal,
    toggleShiny,
    openModal,
  };
};
