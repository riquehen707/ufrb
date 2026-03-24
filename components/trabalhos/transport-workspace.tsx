"use client";

import { useEffect, useMemo, useState } from "react";
import { BusFront, Clock3, MapPin, Navigation, Route, UsersRound } from "lucide-react";

import styles from "@/components/trabalhos/transport-workspace.module.scss";
import { WorkListingCard } from "@/components/trabalhos/work-listing-card";
import type { Listing } from "@/lib/listings";
import { readPermissionState, type AppPermissionState } from "@/lib/permissions";
import {
  estimateTransport,
  getTopWorkFocuses,
  getWorkListingStats,
  routePoints,
} from "@/lib/work-hub";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

type Props = {
  listings: Listing[];
};

type DeviceLocation = {
  lat: number;
  lng: number;
  label: string;
};

export function TransportWorkspace({ listings }: Props) {
  const stats = getWorkListingStats(listings);
  const offers = listings.filter((listing) => listing.intent === "offer");
  const requests = listings.filter((listing) => listing.intent === "request");
  const focuses = getTopWorkFocuses(listings);

  const [originId, setOriginId] = useState(routePoints[1]?.id ?? routePoints[0].id);
  const [destinationId, setDestinationId] = useState(routePoints[0].id);
  const [departureTime, setDepartureTime] = useState("07:10");
  const [ridersCount, setRidersCount] = useState(3);
  const [deviceLocation, setDeviceLocation] = useState<DeviceLocation | null>(null);
  const [locationPermission, setLocationPermission] =
    useState<AppPermissionState>("unsupported");
  const [locationMessage, setLocationMessage] = useState<{
    tone: "info" | "success" | "error";
    text: string;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const selectedOrigin = routePoints.find((point) => point.id === originId) ?? routePoints[0];
  const selectedDestination =
    routePoints.find((point) => point.id === destinationId) ?? routePoints[0];

  const routeEstimate = useMemo(
    () =>
      estimateTransport(
        deviceLocation ?? selectedOrigin,
        selectedDestination,
        ridersCount,
      ),
    [deviceLocation, ridersCount, selectedDestination, selectedOrigin],
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
        text: "Libera a localizacao do navegador para ajustar teu ponto de saida.",
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
      text: "Buscando tua localizacao para estimar a rota.",
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
          text: "Localizacao adicionada ao calculo.",
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
      text: "Voltamos para o ponto manual da rota.",
    });
  }

  return (
    <div className={styles.stack}>
      <section className={styles.metrics}>
        <article className={styles.metricCard}>
          <BusFront size={18} />
          <strong>{offers.length}</strong>
          <span>rotas publicadas</span>
        </article>
        <article className={styles.metricCard}>
          <UsersRound size={18} />
          <strong>{requests.length}</strong>
          <span>pedidos de transporte</span>
        </article>
        <article className={styles.metricCard}>
          <Route size={18} />
          <strong>{stats.campusCount || 1}</strong>
          <span>campi ou cidades</span>
        </article>
      </section>

      {focuses.length ? (
        <div className={styles.focusRow} aria-label="Recortes de transporte">
          {focuses.map((focus) => (
            <span key={focus} className={styles.focusChip}>
              {focus}
            </span>
          ))}
        </div>
      ) : null}

      <section className={styles.plannerGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className="eyebrow">Planejar</span>
              <h2>Estimativa rapida da rota</h2>
            </div>
          </div>

          <div className={styles.fieldGrid}>
            <div className="field">
              <label htmlFor="transport-origin">Saida</label>
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

          <div className={styles.fieldGrid}>
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
              <label htmlFor="transport-riders">Pessoas</label>
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

          <div className={styles.actionRow}>
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
                Voltar para ponto manual
              </button>
            ) : null}
          </div>

          <div className={styles.permissionRow}>
            <span className={styles.permissionChip}>
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

        <article className={styles.estimateCard}>
          <div className={styles.panelHeader}>
            <div>
              <span className="eyebrow">Estimativa</span>
              <h2>
                {(deviceLocation?.label ?? selectedOrigin.label)} ate{" "}
                {selectedDestination.label}
              </h2>
            </div>
          </div>

          <div className={styles.estimateGrid}>
            <article className={styles.estimateMetric}>
              <span>Distancia</span>
              <strong>{routeEstimate.distanceKm.toFixed(1)} km</strong>
            </article>
            <article className={styles.estimateMetric}>
              <span>Tempo</span>
              <strong>{routeEstimate.durationMinutes} min</strong>
            </article>
            <article className={styles.estimateMetric}>
              <span>Total</span>
              <strong>{moneyFormatter.format(routeEstimate.totalFare)}</strong>
            </article>
            <article className={styles.estimateMetric}>
              <span>Por pessoa</span>
              <strong>{moneyFormatter.format(routeEstimate.splitFare)}</strong>
            </article>
          </div>

          <div className={styles.noteCard}>
            <Clock3 size={16} />
            <p>
              Saindo as <strong>{departureTime}</strong>, o app estima uma corrida de{" "}
              <strong>{moneyFormatter.format(routeEstimate.totalFare)}</strong> e um rateio
              de <strong>{moneyFormatter.format(routeEstimate.splitFare)}</strong> por pessoa.
            </p>
          </div>
        </article>
      </section>

      <section className={styles.board}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className="eyebrow">Rotas publicadas</span>
              <h2>Quem esta oferecendo transporte</h2>
            </div>
            <span className={styles.countChip}>{offers.length}</span>
          </div>

          {offers.length ? (
            <div className={styles.cardGrid}>
              {offers.map((listing) => (
                <WorkListingCard
                  key={listing.id}
                  listing={listing}
                  actionLabel="Ver rota"
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <strong>Ainda nao existe rota publicada nessa aba.</strong>
              <p>Quando estudantes abrirem rotas reais, elas aparecem aqui.</p>
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className="eyebrow">Pedidos</span>
              <h2>Quem esta buscando transporte</h2>
            </div>
            <span className={styles.countChip}>{requests.length}</span>
          </div>

          {requests.length ? (
            <div className={styles.cardGrid}>
              {requests.map((listing) => (
                <WorkListingCard
                  key={listing.id}
                  listing={listing}
                  actionLabel="Responder pedido"
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <strong>Sem pedidos abertos por enquanto.</strong>
              <p>Assim que alguem procurar transporte, a demanda aparece aqui.</p>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
