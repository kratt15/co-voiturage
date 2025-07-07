import type { HttpContext } from "@adonisjs/core/http";
import Trip from "#models/trip";
// import { createTripValidator } from "#validators/trip";
// import { DateTime } from "luxon";
import { RouteService } from "#services/route_service";
import { inject } from "@adonisjs/core/container";

@inject()
export default class TripsController {
  constructor(private routeService: RouteService) {}
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

      const route = await this.routeService.getDirections(
        departureCoordinates,
        arrivalCoordinates,
      );
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

  async createTripWithOptimization({ request, response }: HttpContext) {
    try {
      const body = request.body();
      const departureCoordinates = body.departureCoordinates;
      const arrivalCoordinates = body.arrivalCoordinates;
      const waypoints = body.waypoints || []; // Points intermédiaires optionnels

      console.log("departureCoordinates:", departureCoordinates);
      console.log("arrivalCoordinates:", arrivalCoordinates);
      console.log("waypoints:", waypoints);

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

      // Vérifier les waypoints s'ils sont fournis
      if (waypoints.length > 0) {
        for (const waypoint of waypoints) {
          if (!waypoint.latitude || !waypoint.longitude) {
            return response.status(400).json({
              message:
                "Tous les waypoints doivent contenir latitude et longitude",
            });
          }
        }
      }

      // Préparer toutes les coordonnées pour l'optimisation
      const allCoordinates = [
        departureCoordinates,
        ...waypoints,
        arrivalCoordinates,
      ];

      // Si nous n'avons que 2 points (départ et arrivée), utiliser getDirections au lieu d'optimisation
      if (allCoordinates.length === 2) {
        console.log("Utilisation de getDirections pour 2 points");
        const route = await this.routeService.getDirections(
          departureCoordinates,
          arrivalCoordinates,
        );
        return response.status(201).json({
          message: "Trip created successfully",
          route,
          optimization: null,
          note: "Optimisation non nécessaire pour 2 points, route directe utilisée",
        });
      }

      // Utiliser l'optimisation pour 3 points ou plus
      console.log(
        "Utilisation de getOptimization pour",
        allCoordinates.length,
        "points",
      );
      const optimization =
        await this.routeService.getOptimization(allCoordinates);

      return response.status(201).json({
        message: "Trip created successfully",
        optimization,
        route: null,
        note: "Optimisation appliquée pour plusieurs points",
      });
    } catch (error) {
      console.error("Erreur dans createTripWithOptimization:", error);
      return response.status(400).json({
        message: "Erreur lors de la création du trajet avec optimisation",
        error: error.message || "Erreur inconnue",
      });
    }
  }
}
