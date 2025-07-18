import type { HttpContext } from "@adonisjs/core/http";
import Trip from "#models/trip";
import { createTripValidator, updateTripValidator } from "#validators/trip";
import { DateTime } from "luxon";
// import { RouteService } from "#services/route_service";
// import { MapboxRouteDirectionsService } from "#services/mapbox_route_directions_service";
// import { MapboxRouteOptimizationService } from "#services/mapbox_route_optimization_service";
import { MapboxRouteMatrixService } from "#services/mapbox_route_matrix_service";
import { inject } from "@adonisjs/core/container";
import { MapboxRouteGeocodingService } from "#services/mapbox_route_geocoding_service";
import type { Coordinates } from "#models/trip";
import { TripStatus } from "#models/trip";
@inject()
export default class TripsController {
  constructor(
    // private routeService: RouteService,
    // private mapboxRouteDirectionsService: MapboxRouteDirectionsService,
    // private optimizationService: MapboxRouteOptimizationService,
    private geocodingService: MapboxRouteGeocodingService,
    private matrixService: MapboxRouteMatrixService,
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

  async createTrip({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      const tripData = await request.validateUsing(createTripValidator);

      // Créer le trajet dans la base de données
      const trip = await Trip.create({
        ...tripData,
        driverId: user.id,
        vehicleId: tripData.vehicleId,
        status: "PUBLISHED" as TripStatus,
        departureDate: DateTime.fromJSDate(tripData.departureDate),
        departureTime: tripData.departureTime,
        estimatedDuration: tripData.estimatedDuration,
        distanceKm: tripData.distanceKm,
        pricePerSeat: tripData.pricePerSeat,
        availableSeats: tripData.availableSeats,
        totalSeats: tripData.totalSeats,
        departureCoordinates: tripData.departureCoordinates as Coordinates,
        arrivalCoordinates: tripData.arrivalCoordinates as Coordinates,
        possibleStops: tripData.possibleStops as {
          stop_1: string;
          stop_2: string;
        },
      });

      // Charger les relations
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

      return response.created({
        message: "Trajet créé avec succès",
        trip,
      });
    } catch (error) {
      console.error("Erreur dans createTripWithOptimization:", error);
      return response.badRequest({
        message: "Erreur lors de la création du trajet",
        error: error.message,
      });
    }
  }
  async updateTrip({ request, response, auth, params }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      const { uuid } = params;
      const tripData = await request.validateUsing(updateTripValidator);

      // Vérifier que le trajet existe et appartient au conducteur
      const trip = await Trip.query()
        .where("uuid", uuid)
        .where("driverId", user.id)
        .firstOrFail();

      // Mettre à jour uniquement les champs fournis
      if (tripData.departureCoordinates) {
        trip.departureCoordinates =
          tripData.departureCoordinates as Coordinates;
      }
      if (tripData.arrivalCoordinates) {
        trip.arrivalCoordinates = tripData.arrivalCoordinates as Coordinates;
      }
      if (tripData.departureDate) {
        trip.departureDate = DateTime.fromJSDate(tripData.departureDate);
      }
      if (tripData.departureTime) {
        trip.departureTime = tripData.departureTime;
      }
      if (tripData.departureCity) {
        trip.departureCity = tripData.departureCity;
      }
      if (tripData.arrivalCity) {
        trip.arrivalCity = tripData.arrivalCity;
      }
      if (tripData.estimatedDuration) {
        trip.estimatedDuration = tripData.estimatedDuration;
      }
      if (tripData.distanceKm) {
        trip.distanceKm = tripData.distanceKm;
      }
      if (tripData.pricePerSeat) {
        trip.pricePerSeat = tripData.pricePerSeat;
      }
      if (tripData.availableSeats) {
        trip.availableSeats = tripData.availableSeats;
      }
      if (tripData.totalSeats) {
        trip.totalSeats = tripData.totalSeats;
      }
      if (tripData.comments !== undefined) {
        trip.comments = tripData.comments;
      }
      if (tripData.petsAllowed !== undefined) {
        trip.petsAllowed = tripData.petsAllowed;
      }
      if (tripData.luggageAllowed !== undefined) {
        trip.luggageAllowed = tripData.luggageAllowed;
      }
      if (tripData.possibleStops) {
        trip.possibleStops = tripData.possibleStops;
      }
      if (tripData.vehicleId) {
        trip.vehicleId = tripData.vehicleId;
      }

      await trip.save();

      // Charger les relations
      await trip.load("driver", (query) => {
        query.select("uuid");
      });
      await trip.load("vehicle", (query) => {
        query.select(
          "uuid",
          "brand",
          "model",
          "color",
          "numberOfSeats",
          "fuelType",
        );
      });

      return response.ok({
        message: "Trajet mis à jour avec succès",
        trip,
      });
    } catch (error) {
      console.error("Erreur dans updateTrip:", error);
      return response.badRequest({
        message: "Erreur lors de la mise à jour du trajet",
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
  // Tester les matrix
  async testMatrix({ request, response }: HttpContext) {
    try {
      const { coordinates } = request.body();
      const matrix = await this.matrixService.getMatrix(coordinates);
      return response.ok({ matrix });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors du test des matrix",
        error: error.message,
      });
    }
  }
  // Tester les matrix symétrique
  async testSymmetricMatrix({ request, response }: HttpContext) {
    try {
      const { coordinates } = request.body();
      const matrix = await this.matrixService.getSymmetricMatrix(coordinates);
      return response.ok({ matrix });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors du test des matrix symétriques",
        error: error.message,
      });
    }
  }
  // Tester les matrix one to many
  async testOneToManyMatrix({ request, response }: HttpContext) {
    try {
      const { source, destinations } = request.body();
      const matrix = await this.matrixService.getOneToManyMatrix(
        source,
        destinations,
      );
      return response.ok({ matrix });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors du test des matrix one to many",
        error: error.message,
      });
    }
  }
  // Tester les matrix many to one
  async testManyToOneMatrix({ request, response }: HttpContext) {
    try {
      const { sources, destination } = request.body();
      const matrix = await this.matrixService.getManyToOneMatrix(
        sources,
        destination,
      );
      return response.ok({ matrix });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors du test des matrix many to one",
        error: error.message,
      });
    }
  }
  // Tester les matrix traffic
  async testTrafficMatrix({ request, response }: HttpContext) {
    try {
      const { coordinates } = request.body();
      const matrix = await this.matrixService.getTrafficMatrix(coordinates);
      return response.ok({ matrix });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors du test des matrix traffic",
        error: error.message,
      });
    }
  }
  // Tester les matrix curbside
  async testCurbsideMatrix({ request, response }: HttpContext) {
    try {
      const { coordinates } = request.body();
      const matrix = await this.matrixService.getCurbsideMatrix(coordinates);
      return response.ok({ matrix });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors du test des matrix curbside",
        error: error.message,
      });
    }
  }
  // Tester les matrix fallback
  async testFallbackMatrix({ request, response }: HttpContext) {
    try {
      const { coordinates } = request.body();
      const matrix =
        await this.matrixService.getMatrixWithFallback(coordinates);
      return response.ok({ matrix });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors du test des matrix fallback",
        error: error.message,
      });
    }
  }
  // Tester le point le plus proche
  async testNearestDestination({ request, response }: HttpContext) {
    try {
      const { origin, destinations } = request.body();
      const nearestDestination =
        await this.matrixService.findNearestDestination(origin, destinations);
      return response.ok({ nearestDestination });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors du test du point le plus proche",
        error: error.message,
      });
    }
  }
}
