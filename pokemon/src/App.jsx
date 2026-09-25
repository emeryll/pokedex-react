import axios from "axios";
import React from "react";
import "./App.css";
import { useState } from "react";

function App() {
  const [pokemon, setPokemon] = useState([]);
  const url = "https://pokeapi.co/api/v2/pokemon/ditto";

  axios.get(url).then(function (response) {
    setPokemon(response);
  });

  return <div></div>;
}

export default App;
