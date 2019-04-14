import {
  getCalor_sensible,
  setPeopleHeat,
  setCalorVentilacion,
  calculoTotalSensible,
  getCFMCalorNetoSensible,
  calcularHumedadEntradaSerp
} from './calculoCalor';

import tablaCalorPersonas from '../json/calor_personas_6_11';
import tablaCFM from '../json/CFM_6_15';

// CFMventilacion = CFM_tabla * Numero de personas (ver function setCalorVentilacion)
const getTempEntradaSerpentin = (CFMnetoSensible, CFMventilacion, exterior, recinto) => {
  const aireExterior = CFMventilacion * exterior.bulbo_seco;
  const aireRetorno = recinto.bulbo_seco * (CFMnetoSensible - CFMventilacion);
  return (aireExterior + aireRetorno) / CFMnetoSensible;
};

const calorTotal = (
  tempEntradaSerpentin,
  CFMnetoSensible, //=11189,
  recinto,
  humedadEntradaSerp
) => {
  const tempSalidaSerp = recinto.bulbo_seco - 20;
  const humedadSalidaSerp = 65;
  const QS = 1.1 * CFMnetoSensible * (tempEntradaSerpentin - tempSalidaSerp);
  const QL = 0.68 * CFMnetoSensible * (humedadEntradaSerp - humedadSalidaSerp);
  return { QS, QL };
};

export const getCargaEnfriamiento = state => {
  const FEET = 3.28084;

  const Δtemp = state.exterior.bulbo_seco - state.recinto.bulbo_seco;
  const ΔHumedad = state.exterior.humedad_especifica - state.recinto.humedad_especifica;
  const perimeter = 2 * FEET * (state.width + state.depth);
  const factorCorrecionCalorSensible = getCalor_sensible(state.windows, state.walls, perimeter);

  const calorLuces =
    state.luces.wattsPorLampara *
    state.luces.numberOfLights *
    state.luces.factConv *
    factorCorrecionCalorSensible;

  const heatEquipments =
    state.piso.areaNeta * state.luces.factConv * state.recinto.equitmentWattsPerSquaredFoot;

  const calorPersonas = setPeopleHeat(
    state.numberOfPeople,
    factorCorrecionCalorSensible,
    tablaCalorPersonas,
    state.recinto.actividad_recinto
  );

  const cfmMinimo = Number(
    tablaCFM.find(x => x.lugar === state.recinto.tipo_recinto)['cfm_minimo']
  );

  const calorVentilacion = setCalorVentilacion(state.numberOfPeople, Δtemp, ΔHumedad, cfmMinimo);

  //Calculo final
  const sensibleEl = calculoTotalSensible(
    state.windows,
    state.walls,
    state.techo,
    state.doors,
    factorCorrecionCalorSensible
  );

  const ganancia_calor_recinto = sensibleEl + calorLuces + calorPersonas.sensible + heatEquipments;

  const ganancia_ventilador_forzado = ganancia_calor_recinto * 0.025;

  const totalSensible =
    ganancia_calor_recinto + calorVentilacion.sensible + ganancia_ventilador_forzado;

  const CFMnetoSensible = getCFMCalorNetoSensible(totalSensible);

  const tempEntradaSerpentin = getTempEntradaSerpentin(
    CFMnetoSensible,
    calorVentilacion.CFMventilacion,
    state.exterior,
    state.recinto
  );

  const humedadEntradaSerp = calcularHumedadEntradaSerp(state, tempEntradaSerpentin);

  const { QS, QL } = calorTotal(
    tempEntradaSerpentin,
    CFMnetoSensible,
    state.recinto,
    humedadEntradaSerp
  );

  const cargaEnfriamiento = totalSensible + calorPersonas.latente + calorVentilacion.latente;

  return {
    cargaEnfriamiento,
    CFMnetoSensible,
    QS_QL: QS + QL
  };
};
