import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import bootstrap from 'bootstrap/dist/css/bootstrap.min.css'; // eslint-disable-line no-unused-vars
import styles from '../Styles/css.css'; // eslint-disable-line no-unused-vars

import CanvasElement from '../RoomCanvas';
import CardForm from '../CardForm';
import EquipmentsView from '../Equipments';
import helpDoc from '../../../img/help.pdf';

const MainView = () => (
  <div className="container-fluid">
    <nav className="u-navbar navbar fixed-top navbar-light bg-light">
      <span className="navbar-brand mb-0 h1">U-Confort</span>
      <span className="navbar-text">
        Cálculo de cargas térmicas para selección de equipos en ciudades del caribe colombiano
      </span>
      <a
        href={helpDoc}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-outline-primary my-2 my-sm-0"
        type="submit"
      >
        Ayuda
      </a>
    </nav>
    <div className="u-body row">
      <div className="col-xl-8 col-lg-7 col-md-5">
        <CanvasElement id="cubeContainer" />
      </div>
      <div className="col-xl-4 col-lg-5 col-md-7">
        <CardForm />
      </div>
    </div>
  </div>
);

export const App = () => (
  <Router>
    <div>
      <Route exact path="/" component={MainView} />
      <Route path="/equipment" component={EquipmentsView} />
    </div>
  </Router>
);
