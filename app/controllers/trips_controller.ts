import type { HttpContext } from "@adonisjs/core/http";
import Trip from "#models/trip";
import { createTripValidator } from "#validators/trip";
import { DateTime } from "luxon";
// import { RouteService } from "#services/route_service";
import { MapboxRouteDirectionsService } from "#services/mapbox_route_directions_service";
import { MapboxRouteOptimizationService } from "#services/mapbox_route_optimization_service";
import { inject } from "@adonisjs/core/container";
import { MapboxRouteGeocodingService } from "#services/mapbox_route_geocoding_service";

@inject()
export default class TripsController {
  constructor(
    // private routeService: RouteService,
    private mapboxRouteDirectionsService: MapboxRouteDirectionsService,
    private optimizationService: MapboxRouteOptimizationService,
    private geocodingService: MapboxRouteGeocodingService,
  ) {}

  async getAllTrips({ response }: HttpContext) {
    try {
      const trips = await Trip.query()
        .preload("driver", (query) => {
          query.select("uuid");
        })
        .preload("vehicle", (query) => {
          query.select(
            "uuid",
            "brand",
            "model",
            "color",
            "numberOfSeats",
            "fuelType",
          );
        });
      const transformedTrips = trips.map((trip) => {
        const tripData = trip.toJSON();
        if (tripData.driver) {
          delete tripData.driver.id;
        }
        if (tripData.vehicle) {
          delete tripData.vehicle.id;
        }
        return tripData;
      });
      return response.json(transformedTrips);
    } catch (error) {
      return response
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  async showTrip({ response, request }: HttpContext) {
    try {
      const { uuid } = request.params();
      const trip = await Trip.findBy("uuid", uuid);
      await trip?.load("driver", (query) => {
        query.select("uuid");
      });
      await trip?.load("vehicle", (query) => {
        query.select(
          "uuid",
          "brand",
          "model",
          "color",
          "numberOfSeats",
          "fuelType",
        );
      });
      if (!trip) {
        return response.status(404).json({ message: "Trip not found" });
      }
      const transformedTrip = trip.toJSON();
      if (transformedTrip.driver) {
        delete transformedTrip.driver.id;
      }
      if (transformedTrip.vehicle) {
        delete transformedTrip.vehicle.id;
      }
      return response.json(transformedTrip);
    } catch (error) {
      return response
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  async createTrip({ request, response }: HttpContext) {
    try {
      // const tripData = await request.validateUsing(createTripValidator)
      const body = request.body();
      const departureCoordinates = body.departureCoordinates;
      const arrivalCoordinates = body.arrivalCoordinates;

      console.log("departureCoordinates:", departureCoordinates);
      console.log("arrivalCoordinates:", arrivalCoordinates);

      // Vérifier que les coordonnées sont présentes
      if (!departureCoordinates || !arrivalCoordinates) {
        return response.status(400).json({
          message: "Les coordonnées de départ et d'arrivée sont requises",
          debug: {
            body: body,
            departureCoordinates: departureCoordinates,
            arrivalCoordinates: arrivalCoordinates,
          },
        });
      }

      // Vérifier que les coordonnées ont la bonne structure
      if (
        !departureCoordinates.latitude ||
        !departureCoordinates.longitude ||
        !arrivalCoordinates.latitude ||
        !arrivalCoordinates.longitude
      ) {
        return response.status(400).json({
          message: "Les coordonnées doivent contenir latitude et longitude",
        });
      }

      // const route = await this.routeService.getDirections(
      //   departureCoordinates,
      //   arrivalCoordinates,
      // );
      // Simple route
      const route = await this.mapboxRouteDirectionsService.getSimpleRoute(
        departureCoordinates,
        arrivalCoordinates,
      );
      // Alternatives routes
      // const route = await this.mapboxRouteDirectionsService.getRouteAlternatives(
      //   departureCoordinates,
      //   arrivalCoordinates,
      // );

      // await Trip.create({
      //   ...tripData,
      //   driverId: tripData.driverId,
      //   vehicleId: tripData.vehicleId,
      //   status: "DRAFT",
      //   departureDate: DateTime.fromJSDate(tripData.departureDate),
      //   departureTime: tripData.departureTime,
      //   estimatedDuration: tripData.estimatedDuration,
      //   distanceKm: tripData.distanceKm,
      //   pricePerSeat: tripData.pricePerSeat,
      //   availableSeats: tripData.availableSeats,
      //   totalSeats: tripData.totalSeats,
      //   departureCoordinates: `${tripData.departureCoordinates.latitude},${tripData.departureCoordinates.longitude}`,
      //   arrivalCoordinates: `${tripData.arrivalCoordinates.latitude},${tripData.arrivalCoordinates.longitude}`,
      // })
      return response
        .status(201)
        .json({ message: "Trip created successfully", route });
    } catch (error) {
      return response.status(400).json({ message: error });
    }
  }

  async createTripWithOptimization({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      const tripData = await request.validateUsing(createTripValidator);

      // Créer le trajet dans la base de données
      const trip = await Trip.create({
        ...tripData,
        driverId: user.id,
        vehicleId: tripData.vehicleId,
        status: tripData.status || "PUBLISHED",
        departureDate: DateTime.fromJSDate(tripData.departureDate),
        departureTime: tripData.departureTime,
        estimatedDuration: tripData.estimatedDuration,
        distanceKm: tripData.distanceKm,
        pricePerSeat: tripData.pricePerSeat,
        availableSeats: tripData.availableSeats,
        totalSeats: tripData.totalSeats,
        departureCoordinates: `${tripData.departureCoordinates.latitude},${tripData.departureCoordinates.longitude}`,
        arrivalCoordinates: `${tripData.arrivalCoordinates.latitude},${tripData.arrivalCoordinates.longitude}`,
      });

      // Charger les relations
      await trip.load("driver");
      await trip.load("vehicle");

      // Si des réservations existent déjà (peu probable pour un nouveau trajet), optimiser
      await trip.load("bookings");

      let optimizationResult = null;
      if (trip.bookings && trip.bookings.length > 0) {
        try {
          optimizationResult =
            await this.optimizationService.optimizeTripWithBookings(trip.id);
          console.log("Trajet optimisé avec succès");
        } catch (error) {
          console.error("Erreur lors de l'optimisation:", error);
          // Ne pas bloquer la création du trajet si l'optimisation échoue
        }
      }

      return response.created({
        message: "Trajet créé avec succès",
        trip,
        optimization: optimizationResult,
      });
    } catch (error) {
      console.error("Erreur dans createTripWithOptimization:", error);
      return response.badRequest({
        message: "Erreur lors de la création du trajet",
        error: error.message,
      });
    }
  }

  /**
   * Optimiser un trajet existant
   */
  async optimizeTrip({ params, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      const tripId = params.id;

      // Vérifier que le trajet existe et appartient au conducteur
      const trip = await Trip.query()
        .where("id", tripId)
        .where("driverId", user.id)
        .firstOrFail();

      // Optimiser le trajet
      const optimizationResult =
        await this.optimizationService.optimizeTripWithBookings(trip.id);

      return response.ok({
        message: "Trajet optimisé avec succès",
        optimization: optimizationResult,
      });
    } catch (error) {
      console.error("Erreur lors de l'optimisation:", error);
      return response.badRequest({
        message: "Erreur lors de l'optimisation du trajet",
        error: error.message,
      });
    }
  }

  /**
   * Obtenir la route optimisée d'un trajet
   */
  async getOptimizedRoute({ params, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      const tripUuid = params.uuid;

      // Récupérer le trajet
      const trip = await Trip.query()
        .where("uuid", tripUuid)
        .where((query) => {
          query
            .where("driverId", user.id)
            .orWhereHas("bookings", (bookingQuery) => {
              bookingQuery.where("passengerId", user.id);
            });
        })
        .preload("bookings", (query) => {
          query.whereIn("status", ["CONFIRMED", "PAID"]);
        })
        .firstOrFail();

      // Retourner la route optimisée si elle existe
      const optimizedRoute = trip.$extras.optimized_route || null;
      const lastOptimizedAt = trip.$extras.last_optimized_at || null;

      if (!optimizedRoute) {
        return response.ok({
          message: "Aucune route optimisée disponible",
          trip: {
            uuid: trip.uuid,
            departureCity: trip.departureCity,
            arrivalCity: trip.arrivalCity,
          },
          optimizedRoute: null,
          lastOptimizedAt: null,
        });
      }

      return response.ok({
        message: "Route optimisée récupérée avec succès",
        trip: {
          uuid: trip.uuid,
          departureCity: trip.departureCity,
          arrivalCity: trip.arrivalCity,
        },
        optimizedRoute,
        lastOptimizedAt,
        bookingsCount: trip.bookings.length,
      });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors de la récupération de la route optimisée",
        error: error.message,
      });
    }
  }
  // tester les geocoding
  async testGeocoding({ request, response }: HttpContext) {
    try {
      const { address } = request.body();
      const coordinates = await this.geocodingService.getCoordinates(address);
      return response.ok({ coordinates: coordinates });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors du geocoding",
        error: error.message,
      });
    }
  }
  async testReverseGeocoding({ request, response }: HttpContext) {
    try {
      const body = request.body();
      console.log("Corps de la requête:", body);

      const { latitude, longitude } = body;

      if (!latitude || !longitude) {
        return response.badRequest({
          message: "Latitude et longitude sont requises",
          received: { latitude, longitude },
        });
      }

      console.log("Coordonnées reçues:", { latitude, longitude });

      const address = await this.geocodingService.getAddress({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });

      console.log("Adresse récupérée:", address);

      return response.ok({ address });
    } catch (error) {
      console.error("Erreur dans testReverseGeocoding:", error);
      return response.badRequest({
        message: "Erreur lors du reverse geocoding",
        error: error.message,
      });
    }
  }
}
