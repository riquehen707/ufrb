"use client";

import { useEffect, useMemo, useState } from "react";
import { BusFront, Clock3, Coins, MapPin, Navigation, Route, UsersRound } from "lucide-react";

import { readPermissionState, type AppPermissionState } from "@/lib/permissions";
import {
  buildTransportRoutePlan,
  getRoutePointById,
  getTransportGroupById,
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
  const initialGroup = transportGroups[0];
  const [role, setRole] = useState<"driver" | "rider">("rider");
  const [activeGroupId, setActiveGroupId] = useState(initialGroup?.id ?? "");
  const [originId, setOriginId] = useState(
    initialGroup?.originPointId ?? routePoints[1]?.id ?? routePoints[0].id,
  );
  const [destinationId, setDestinationId] = useState(
    initialGroup?.destinationPointId ?? routePoints[0].id,
  );
  const [departureTime, setDepartureTime] = useState(
    initialGroup?.departureTime ?? "07:10",
  );
  const [ridersCount, setRidersCount] = useState(
    Math.max(1, initialGroup?.seatsFilled ?? 4),
  );
  const [deviceLocation, setDeviceLocation] = useState<DeviceLocation | null>(null);
  const [locationPermission, setLocationPermission] =
    useState<AppPermissionState>("unsupported");
  const [locationMessage, setLocationMessage] = useState<{
    tone: "info" | "success" | "error";
    text: string;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const selectedOrigin = routePoints.find((point) => point.id === originId) ?? routePoints[0];
  const activeGroup = getTransportGroupById(activeGroupId);
  const routePlan = useMemo(
    () =>
      buildTransportRoutePlan(activeGroup, {
        customStart: deviceLocation ?? selectedOrigin,
        customDestinationId: destinationId,
      }),
    [activeGroup, destinationId, deviceLocation, selectedOrigin],
  );

  useEffect(() => {
    let isMounted = true;

    void readPermissionState("geolocation").then((state) => {
      if (isMounted) {
        setLocationPermission(state);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function requestCurrentLocation() {
    const currentPermission = await readPermissionState("geolocation");
    setLocationPermission(currentPermission);

    if (currentPermission === "denied") {
      setLocationMessage({
        tone: "error",
        text: "Libera a localizacao do navegador para usar tua rota atual.",
      });
      return;
    }

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
        setLocationPermission("granted");
        setLocationMessage({
          tone: "success",
          text: "Localizacao adicionada ao trajeto.",
        });
      },
      () => {
        setIsLocating(false);
        void readPermissionState("geolocation").then(setLocationPermission);
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

  function activateGroup(groupId: string) {
    const matchingGroup = getTransportGroupById(groupId);
    setActiveGroupId(groupId);
    setDepartureTime(matchingGroup.departureTime);
    setOriginId(matchingGroup.originPointId);
    setDestinationId(matchingGroup.destinationPointId);
    setRidersCount(Math.max(1, matchingGroup.seatsFilled));
  }

  return (
    <div className="work-stack">
      <section className="work-highlight-grid">
        <article className="work-metric-card">
          <BusFront size={18} />
          <strong>{activeGroup.driverLabel}</strong>
          <span>motorista</span>
        </article>
        <article className="work-metric-card">
          <Clock3 size={18} />
          <strong>{routePlan.durationMinutes} min</strong>
          <span>rota estimada</span>
        </article>
        <article className="work-metric-card">
          <UsersRound size={18} />
          <strong>{routePlan.pickupCount}</strong>
          <span>inscritos</span>
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
              <label htmlFor="transport-group">Horario com grupo</label>
              <select
                id="transport-group"
                className="select-field"
                value={activeGroupId}
                onChange={(event) => activateGroup(event.target.value)}
              >
                {transportGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.departureTime} · {group.title}
                  </option>
                ))}
              </select>
            </div>

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
              onClick={() => void requestCurrentLocation()}
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

          <div className="permission-chip-row" aria-label="Permissao de localizacao">
            <span className="active-filter-pill">
              Localizacao{" "}
              {locationPermission === "granted"
                ? "liberada"
                : locationPermission === "denied"
                  ? "bloqueada"
                  : "sob demanda"}
            </span>
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
            Rota automatica
          </span>

          <h3>
            {routePlan.startLabel} ate {routePlan.endLabel}
          </h3>

          <div className="work-estimate-grid">
            <article className="mini-stat-card">
              <span>Distancia</span>
              <strong>{routePlan.totalDistanceKm.toFixed(1)} km</strong>
            </article>
            <article className="mini-stat-card">
              <span>Tempo</span>
              <strong>{routePlan.durationMinutes} min</strong>
            </article>
            <article className="mini-stat-card">
              <span>Total da corrida</span>
              <strong>{moneyFormatter.format(routePlan.totalFare)}</strong>
            </article>
            <article className="mini-stat-card">
              <span>Rateio por pessoa</span>
              <strong>{moneyFormatter.format(routePlan.splitFare)}</strong>
            </article>
          </div>

          <div className="work-inline-note">
            {role === "driver"
              ? `Se tu fizer essa rota agora, a corrida fecha em ${moneyFormatter.format(routePlan.totalFare)}.`
              : `Entrando nesse horario, tua parte fica em ${moneyFormatter.format(routePlan.splitFare)}.`}
          </div>

          <div className="transport-route-list" aria-label="Ordem sugerida de paradas">
            {routePlan.stops.map((stop, index) => (
              <article key={stop.pointId} className="transport-route-stop">
                <span className="transport-route-index">{index + 1}</span>
                <div className="transport-route-copy">
                  <strong>{stop.label}</strong>
                  <span>
                    {stop.pickupCount} pessoa(s) · {stop.riderNames.join(", ")}
                  </span>
                </div>
                <span className="transport-route-meta">
                  +{stop.distanceFromPreviousKm.toFixed(1)} km
                </span>
              </article>
            ))}

            <article className="transport-route-stop transport-route-stop-arrival">
              <span className="transport-route-index">
                {routePlan.stops.length + 1}
              </span>
              <div className="transport-route-copy">
                <strong>{getRoutePointById(activeGroup.destinationPointId).label}</strong>
                <span>Chegada final do grupo.</span>
              </div>
              <span className="transport-route-meta">
                +{routePlan.finalLegDistanceKm.toFixed(1)} km
              </span>
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
            <article
              key={group.id}
              className={`work-demand-card ${activeGroupId === group.id ? "work-demand-card-active" : ""}`}
            >
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
                  {buildTransportRoutePlan(group).totalDistanceKm.toFixed(1)} km
                </span>
                <span>
                  <Coins size={14} />
                  {moneyFormatter.format(buildTransportRoutePlan(group).splitFare)} por pessoa
                </span>
              </div>

              <div className="work-action-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => activateGroup(group.id)}
                >
                  Planejar rota
                </button>
                <button type="button" className="ghost-button">
                  Entrar nesse horario
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
