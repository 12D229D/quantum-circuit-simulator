/**
 * db.js - SQLite Abstraction Layer
 * quantum-circuit-simulator
 *
 * Patron SQLite Abstracto del portafolio Codex:
 * - DDL relacional documentado (compatible con SQLite3 real)
 * - Motor de persistencia: localStorage
 * - Exportacion: dump .sql 100% compatible con sqlite3 CLI
 *
 * Tablas:
 *   circuits       - Circuitos cuanticos guardados por el usuario
 *   gates_applied  - Compuertas aplicadas por circuito (historial)
 *   sim_results    - Resultados de simulacion (probabilidades de estado)
 *   bloch_states   - Estados de la esfera de Bloch guardados
 *
 * NOTA: Se expone como namespace global window.QSimDB para
 * compatibilidad con el modo de scripts clasicos (no ES modules).
 */

(function (global) {
  'use strict';

  var DB_VERSION = 1;
  var STORAGE_KEY = 'qsim_db_v1';

  var SQL_DDL = [
    'PRAGMA journal_mode = WAL;',
    'PRAGMA foreign_keys = ON;',
    '',
    'CREATE TABLE IF NOT EXISTS circuits (',
    '  id           TEXT PRIMARY KEY,',
    '  name         TEXT NOT NULL,',
    '  description  TEXT DEFAULT \'\',',
    '  qubits       INTEGER NOT NULL DEFAULT 1,',
    '  steps        INTEGER NOT NULL DEFAULT 0,',
    '  circuit_json TEXT NOT NULL DEFAULT \'{}\',',
    '  created_at   TEXT NOT NULL,',
    '  updated_at   TEXT NOT NULL',
    ');',
    '',
    'CREATE TABLE IF NOT EXISTS gates_applied (',
    '  id          TEXT PRIMARY KEY,',
    '  circuit_id  TEXT NOT NULL REFERENCES circuits(id) ON DELETE CASCADE,',
    '  gate_name   TEXT NOT NULL,',
    '  qubit       INTEGER NOT NULL DEFAULT 0,',
    '  step        INTEGER NOT NULL DEFAULT 0,',
    '  params_json TEXT DEFAULT \'{}\',',
    '  applied_at  TEXT NOT NULL',
    ');',
    '',
    'CREATE TABLE IF NOT EXISTS sim_results (',
    '  id           TEXT PRIMARY KEY,',
    '  circuit_id   TEXT NOT NULL REFERENCES circuits(id) ON DELETE CASCADE,',
    '  state_label  TEXT NOT NULL,',
    '  probability  REAL NOT NULL DEFAULT 0,',
    '  amplitude_re REAL NOT NULL DEFAULT 0,',
    '  amplitude_im REAL NOT NULL DEFAULT 0,',
    '  computed_at  TEXT NOT NULL',
    ');',
    '',
    'CREATE TABLE IF NOT EXISTS bloch_states (',
    '  id          TEXT PRIMARY KEY,',
    '  circuit_id  TEXT REFERENCES circuits(id) ON DELETE SET NULL,',
    '  qubit_index INTEGER NOT NULL DEFAULT 0,',
    '  theta       REAL NOT NULL DEFAULT 0,',
    '  phi         REAL NOT NULL DEFAULT 0,',
    '  label       TEXT DEFAULT \'\',',
    '  saved_at    TEXT NOT NULL',
    ');'
  ].join('\n');

  // Internals

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : _emptyDb();
    } catch (_) {
      return _emptyDb();
    }
  }

  function _emptyDb() {
    return { version: DB_VERSION, circuits: [], gates_applied: [], sim_results: [], bloch_states: [] };
  }

  function _save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function _now() {
    return new Date().toISOString();
  }

  // Circuits

  function saveCircuit(opts) {
    var id = opts.id, name = opts.name, description = opts.description || '';
    var qubits = opts.qubits || 1, steps = opts.steps || 0;
    var circuit_json = opts.circuit_json || '{}';
    var db = _load();
    var now = _now();
    var idx = id ? db.circuits.findIndex(function(c){ return c.id === id; }) : -1;
    if (idx >= 0) {
      db.circuits[idx] = Object.assign({}, db.circuits[idx], { name: name, description: description, qubits: qubits, steps: steps, circuit_json: circuit_json, updated_at: now });
      _save(db);
      return db.circuits[idx];
    } else {
      var newId = id || _uid();
      var record = { id: newId, name: name, description: description, qubits: qubits, steps: steps, circuit_json: circuit_json, created_at: now, updated_at: now };
      db.circuits.push(record);
      _save(db);
      return record;
    }
  }

  function listCircuits() {
    return _load().circuits;
  }

  function getCircuitById(id) {
    return _load().circuits.find(function(c){ return c.id === id; }) || null;
  }

  function deleteCircuit(id) {
    var db = _load();
    db.circuits      = db.circuits.filter(function(c){ return c.id !== id; });
    db.gates_applied = db.gates_applied.filter(function(g){ return g.circuit_id !== id; });
    db.sim_results   = db.sim_results.filter(function(r){ return r.circuit_id !== id; });
    db.bloch_states  = db.bloch_states.filter(function(b){ return b.circuit_id !== id; });
    _save(db);
  }

  // Gates Applied

  function logGate(opts) {
    var db = _load();
    var entry = {
      id: _uid(),
      circuit_id: opts.circuit_id,
      gate_name: opts.gate_name,
      qubit: opts.qubit || 0,
      step: opts.step || 0,
      params_json: JSON.stringify(opts.params || {}),
      applied_at: _now()
    };
    db.gates_applied.push(entry);
    _save(db);
    return entry;
  }

  function getGatesByCircuit(circuit_id) {
    return _load().gates_applied.filter(function(g){ return g.circuit_id === circuit_id; });
  }

  // Simulation Results

  function saveSimResults(circuit_id, stateVector) {
    var db = _load();
    db.sim_results = db.sim_results.filter(function(r){ return r.circuit_id !== circuit_id; });
    var now = _now();
    for (var i = 0; i < stateVector.length; i++) {
      var s = stateVector[i];
      db.sim_results.push({
        id: _uid(),
        circuit_id: circuit_id,
        state_label:  s.label        || '|0>',
        probability:  s.probability  || 0,
        amplitude_re: s.amplitude_re || 0,
        amplitude_im: s.amplitude_im || 0,
        computed_at: now
      });
    }
    _save(db);
  }

  function getSimResults(circuit_id) {
    return _load().sim_results.filter(function(r){ return r.circuit_id === circuit_id; });
  }

  // Bloch States

  function saveBlochState(opts) {
    var db = _load();
    var entry = {
      id: _uid(),
      circuit_id:  opts.circuit_id  || null,
      qubit_index: opts.qubit_index || 0,
      theta: opts.theta || 0,
      phi:   opts.phi   || 0,
      label: opts.label || '',
      saved_at: _now()
    };
    db.bloch_states.push(entry);
    _save(db);
    return entry;
  }

  // Stats

  function getDBStats() {
    var db = _load();
    return {
      circuits:     db.circuits.length,
      gates:        db.gates_applied.length,
      sim_results:  db.sim_results.length,
      bloch_states: db.bloch_states.length,
      version: DB_VERSION
    };
  }

  // SQL Dump Export

  function exportSQLiteDump() {
    var db = _load();
    var lines = [];
    lines.push('-- SQLite dump - quantum-circuit-simulator');
    lines.push('-- Generado: ' + _now());
    lines.push('-- Version DB: ' + DB_VERSION);
    lines.push('--');
    lines.push('-- Uso: sqlite3 quantum_circuit.db < quantum-circuit-db-dump.sql');
    lines.push('');
    lines.push('PRAGMA foreign_keys = OFF;');
    lines.push('BEGIN TRANSACTION;');
    lines.push('');
    lines.push(SQL_DDL);
    lines.push('');

    var i, c, g, r, b;
    for (i = 0; i < db.circuits.length; i++) {
      c = db.circuits[i];
      var cname = c.name.replace(/'/g, "''");
      var cdesc = (c.description || '').replace(/'/g, "''");
      var cjson = (c.circuit_json || '{}').replace(/'/g, "''");
      lines.push("INSERT OR REPLACE INTO circuits VALUES ('" + c.id + "','" + cname + "','" + cdesc + "'," + c.qubits + "," + c.steps + ",'" + cjson + "','" + c.created_at + "','" + c.updated_at + "');");
    }
    for (i = 0; i < db.gates_applied.length; i++) {
      g = db.gates_applied[i];
      var gpj = (g.params_json || '{}').replace(/'/g, "''");
      lines.push("INSERT OR REPLACE INTO gates_applied VALUES ('" + g.id + "','" + g.circuit_id + "','" + g.gate_name + "'," + g.qubit + "," + g.step + ",'" + gpj + "','" + g.applied_at + "');");
    }
    for (i = 0; i < db.sim_results.length; i++) {
      r = db.sim_results[i];
      var rlbl = (r.state_label || '|0>').replace(/'/g, "''");
      lines.push("INSERT OR REPLACE INTO sim_results VALUES ('" + r.id + "','" + r.circuit_id + "','" + rlbl + "'," + r.probability + "," + r.amplitude_re + "," + r.amplitude_im + ",'" + r.computed_at + "');");
    }
    for (i = 0; i < db.bloch_states.length; i++) {
      b = db.bloch_states[i];
      var bcid = b.circuit_id ? ("'" + b.circuit_id + "'") : 'NULL';
      var blbl = (b.label || '').replace(/'/g, "''");
      lines.push("INSERT OR REPLACE INTO bloch_states VALUES ('" + b.id + "'," + bcid + "," + b.qubit_index + "," + b.theta + "," + b.phi + ",'" + blbl + "','" + b.saved_at + "');");
    }

    lines.push('');
    lines.push('COMMIT;');
    lines.push('PRAGMA foreign_keys = ON;');

    var blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'quantum-circuit-db-dump.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  // Public API

  global.QSimDB = {
    saveCircuit:    saveCircuit,
    listCircuits:   listCircuits,
    getCircuitById: getCircuitById,
    deleteCircuit:  deleteCircuit,
    logGate:        logGate,
    getGatesByCircuit: getGatesByCircuit,
    saveSimResults: saveSimResults,
    getSimResults:  getSimResults,
    saveBlochState: saveBlochState,
    getDBStats:     getDBStats,
    exportSQLiteDump: exportSQLiteDump,
    DB_VERSION:  DB_VERSION,
    STORAGE_KEY: STORAGE_KEY,
    SQL_DDL:     SQL_DDL
  };

})(window);
