export interface Pokemon {
    id: number;
    name: string;
    url: string;
    imageUrl: string;
}
  
export interface PokemonDetails {
    id: number;
    name: string;
    height: number;
    weight: number;
    types: { type: { name: string } }[];
    abilities: { ability: { name: string } }[];
    sprites: {
        front_default: string;
        other: { 'official-artwork': { front_default: string; front_shiny: string } };
        front_shiny: string;
    };
}

export interface EvolutionChain {
    species: { name: string; url: string ; id: number };
    evolves_to: EvolutionChain[];
}