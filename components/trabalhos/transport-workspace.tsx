"use client";

import { useState } from "react";
import { BusFront, Clock3, Coins, MapPin, Navigation, Route, UsersRound } from "lucide-react";

import {
  estimateTransport,
  routePoints,
  transportGroups,
} from "@/lib/work-hub";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

type DeviceLocation = {
  lat: number;
  lng: number;
  label: string;
};

export function TransportWorkspace() {
  const [role, setRole] = useState<"driver" | "rider">("rider");
  const [originId, setOriginId] = useState(routePoints[1]?.id ?? routePoints[0].id);
  const [destinationId, setDestinationId] = useState(routePoints[0].id);
  const [departureTime, setDepartureTime] = useState("07:10");
  const [ridersCount, setRidersCount] = useState(4);
  const [deviceLocation, setDeviceLocation] = useState<DeviceLocation | null>(null);
  const [locationMessage, setLocationMessage] = useState<{
    tone: "info" | "success" | "error";
    text: string;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const selectedOrigin = routePoints.find((point) => point.id === originId) ?? routePoints[0];
  const selectedDestination =
    routePoints.find((point) => point.id === destinationId) ?? routePoints[0];
  const resolvedOrigin = deviceLocation ?? selectedOrigin;
  const estimate = estimateTransport(resolvedOrigin, selectedDestination, ridersCount);

  function requestCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage({
        tone: "error",
        text: "Teu navegador nao liberou geolocalizacao por aqui.",
      });
      return;
    }

    setIsLocating(true);
    setLocationMessage({
      tone: "info",
      text: "Pedindo tua localizacao para ajustar a rota.",
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeviceLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: "Tua localizacao atual",
        });
        setIsLocating(false);
        setLocationMessage({
          tone: "success",
          text: "Localizacao adicionada ao trajeto.",
        });
      },
      () => {
        setIsLocating(false);
        setLocationMessage({
          tone: "error",
          text: "Nao rolou usar tua localizacao agora. Escolhe um ponto manualmente.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  function clearDeviceLocation() {
    setDeviceLocation(null);
    setLocationMessage({
      tone: "info",
      text: "Voltamos para o ponto manual.",
    });
  }

  return (
    <div className="work-stack">
      <section className="work-highlight-grid">
        <article className="work-metric-card">
          <BusFront size={18} />
          <strong>{transportGroups.length}</strong>
          <span>grupos</span>
        </article>
        <article className="work-metric-card">
          <Clock3 size={18} />
          <strong>{departureTime}</strong>
          <span>horario</span>
        </article>
        <article className="work-metric-card">
          <UsersRound size={18} />
          <strong>{ridersCount}</strong>
          <span>no rateio</span>
        </article>
      </section>

      <section className="transport-planner-grid">
        <article className="work-card work-card-strong">
          <div className="work-card-header">
            <div>
              <span className="eyebrow">Planejar</span>
              <h2>Fechar grupo por horario</h2>
            </div>
          </div>

          <div className="toggle-group">
            <span className="toggle-label">Meu papel</span>
            <div className="type-switch" role="tablist" aria-label="Papel no transporte">
              <button
                type="button"
                className={`type-pill ${role === "rider" ? "active" : ""}`}
                onClick={() => setRole("rider")}
              >
                Preciso ser buscado
              </button>
              <button
                type="button"
                className={`type-pill ${role === "driver" ? "active" : ""}`}
                onClick={() => setRole("driver")}
              >
                Vou buscar
              </button>
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="transport-origin">Ponto de partida</label>
              <select
                id="transport-origin"
                className="select-field"
                value={originId}
                onChange={(event) => setOriginId(event.target.value)}
                disabled={Boolean(deviceLocation)}
              >
                {routePoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="transport-destination">Destino</label>
              <select
                id="transport-destination"
                className="select-field"
                value={destinationId}
                onChange={(event) => setDestinationId(event.target.value)}
              >
                {routePoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="transport-time">Horario</label>
              <input
                id="transport-time"
                className="input-field"
                type="time"
                value={departureTime}
                onChange={(event) => setDepartureTime(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="transport-riders">Pessoas nesse horario</label>
              <input
                id="transport-riders"
                className="input-field"
                type="number"
                min={1}
                max={8}
                value={ridersCount}
                onChange={(event) =>
                  setRidersCount(
                    Math.max(1, Math.min(8, Number(event.target.value) || 1)),
                  )
                }
              />
            </div>
          </div>

          <div className="media-action-row">
            <button
              type="button"
              className="ghost-button"
              onClick={requestCurrentLocation}
              disabled={isLocating}
            >
              <Navigation size={16} />
              {isLocating ? "Buscando localizacao..." : "Usar localizacao"}
            </button>

            {deviceLocation ? (
              <button type="button" className="ghost-button" onClick={clearDeviceLocation}>
                <MapPin size={16} />
                Ponto manual
              </button>
            ) : null}
          </div>

          {locationMessage ? (
            <div className="status-banner" data-tone={locationMessage.tone}>
              {locationMessage.text}
            </div>
          ) : null}
        </article>

        <article className="work-card work-estimate-card">
          <span className="account-chip">
            <Route size={16} />
            Estimativa inicial
          </span>

          <h3>
            {resolvedOrigin.label} para {selectedDestination.label}
          </h3>

          <div className="work-estimate-grid">
            <article className="mini-stat-card">
              <span>Distancia</span>
              <strong>{estimate.distanceKm.toFixed(1)} km</strong>
            </article>
            <article className="mini-stat-card">
              <span>Tempo</span>
              <strong>{estimate.durationMinutes} min</strong>
            </article>
            <article className="mini-stat-card">
              <span>Total da corrida</span>
              <strong>{moneyFormatter.format(estimate.totalFare)}</strong>
            </article>
            <article className="mini-stat-card">
              <span>Rateio por pessoa</span>
              <strong>{moneyFormatter.format(estimate.splitFare)}</strong>
            </article>
          </div>

        </article>
      </section>

      <section className="work-card">
        <div className="work-card-header">
          <div>
            <span className="eyebrow">Grupos</span>
            <h3>Horarios abertos</h3>
          </div>
        </div>

        <div className="work-board-grid">
          {transportGroups.map((group) => (
            <article key={group.id} className="work-demand-card">
              <div className="work-demand-topline">
                <span className="status-pill" data-tone="info">
                  {group.departureTime}
                </span>
                <span className="status-pill" data-tone="success">
                  {group.seatsFilled}/{group.seatTotal} pessoas
                </span>
              </div>

              <h4>{group.title}</h4>
              <p>{group.routeLabel}</p>

              <div className="work-demand-meta">
                <span>
                  <Route size={14} />
                  {group.distanceKm.toFixed(1)} km
                </span>
                <span>
                  <Coins size={14} />
                  {moneyFormatter.format(group.splitFare)} por pessoa
                </span>
              </div>

              <button type="button" className="secondary-button">
                Entrar nesse horario
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
