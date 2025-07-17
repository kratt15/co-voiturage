import type { HttpContext } from "@adonisjs/core/http";
import Booking from "#models/booking";
import Trip from "#models/trip";
import { inject } from "@adonisjs/core";
import { MapboxRouteOptimizationService } from "#services/mapbox_route_optimization_service";
import vine from "@vinejs/vine";
import { DateTime } from "luxon";

// Validateurs pour les réservations
const createBookingValidator = vine.compile(
  vine.object({
    tripId: vine.number(),
    numberOfSeats: vine.number().min(1).max(8),
    passengerComment: vine.string().optional(),
  }),
);

const updateBookingValidator = vine.compile(
  vine.object({
    numberOfSeats: vine.number().min(1).max(8).optional(),
    passengerComment: vine.string().optional(),
  }),
);

@inject()
export default class BookingsController {
  constructor(private optimizationService: MapboxRouteOptimizationService) {}

  /**
   * Créer une réservation
   */
  async createBooking({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      const data = await request.validateUsing(createBookingValidator);

      // Vérifier que le trajet existe et est disponible
      const trip = await Trip.query()
        .where("id", data.tripId)
        .where("status", "PUBLISHED")
        .firstOrFail();

      // Vérifier qu'il reste des places
      if (trip.availableSeats < data.numberOfSeats) {
        return response.badRequest({
          message: `Seulement ${trip.availableSeats} places disponibles`,
        });
      }

      // Vérifier que l'utilisateur n'a pas déjà réservé ce trajet
      const existingBooking = await Booking.query()
        .where("tripId", data.tripId)
        .where("passengerId", user.id)
        .whereNotIn("status", ["CANCELLED"])
        .first();

      if (existingBooking) {
        return response.badRequest({
          message: "Vous avez déjà une réservation pour ce trajet",
        });
      }

      // Créer la réservation
      const booking = await Booking.create({
        tripId: data.tripId,
        passengerId: user.id,
        numberOfSeats: data.numberOfSeats,
        totalAmount: trip.pricePerSeat * data.numberOfSeats,
        status: "CONFIRMED",
        passengerComment: data.passengerComment,
        bookingDate: DateTime.now(),
      });

      // Mettre à jour les places disponibles
      await trip.updateAvailableSeats();

      // Réoptimiser le trajet avec la nouvelle réservation
      try {
        await this.optimizationService.reoptimizeTrip(trip.id);
      } catch (error) {
        console.error("Erreur lors de l'optimisation:", error);
        // Ne pas bloquer la réservation si l'optimisation échoue
      }

      // Charger les relations pour la réponse
      await booking.load("trip", (query) => {
        query.preload("driver");
      });

      return response.created({
        message: "Réservation créée avec succès",
        booking,
      });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors de la création de la réservation",
        error: error.message,
      });
    }
  }

  /**
   * Obtenir toutes les réservations de l'utilisateur connecté
   */
  async getMyBookings({ response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail();

      const bookings = await Booking.query()
        .where("passengerId", user.id)
        .preload("trip", (query) => {
          query.preload("driver");
          query.preload("vehicle");
        })
        .orderBy("createdAt", "desc");

      return response.ok({
        message: "Réservations récupérées avec succès",
        bookings,
      });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors de la récupération des réservations",
        error: error.message,
      });
    }
  }

  /**
   * Obtenir toutes les réservations pour un trajet (conducteur)
   */
  async getTripBookings({ params, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      const tripUuid = params.uuid;

      // Vérifier que le trajet appartient au conducteur
      const trip = await Trip.query()
        .where("uuid", tripUuid)
        .where("driverId", user.id)
        .firstOrFail();

      const bookings = await Booking.query()
        .where("tripId", trip.id)
        .whereNotIn("status", ["CANCELLED"])
        .preload("passenger")
        .orderBy("createdAt", "asc");

      return response.ok({
        message: "Réservations du trajet récupérées avec succès",
        bookings,
      });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors de la récupération des réservations",
        error: error.message,
      });
    }
  }

  /**
   * Obtenir les détails d'une réservation
   */
  async getBooking({ params, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      const bookingUuid = params.uuid;

      const booking = await Booking.query()
        .where("uuid", bookingUuid)
        .where((query) => {
          query
            .where("passengerId", user.id)
            .orWhereHas("trip", (tripQuery) => {
              tripQuery.where("driverId", user.id);
            });
        })
        .preload("trip", (query) => {
          query.preload("driver");
          query.preload("vehicle");
        })
        .preload("passenger")
        .firstOrFail();

      return response.ok({
        message: "Réservation récupérée avec succès",
        booking,
      });
    } catch (error) {
      return response.notFound({
        message: "Réservation non trouvée",
      });
    }
  }

  /**
   * Mettre à jour une réservation
   */
  async updateBooking({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      const bookingUuid = params.uuid;
      const data = await request.validateUsing(updateBookingValidator);

      const booking = await Booking.query()
        .where("uuid", bookingUuid)
        .where("passengerId", user.id)
        .whereIn("status", ["PENDING", "CONFIRMED"])
        .firstOrFail();

      // Si le nombre de places change, vérifier la disponibilité
      if (data.numberOfSeats && data.numberOfSeats !== booking.numberOfSeats) {
        const trip = await Trip.find(booking.tripId);
        const placesSupplementaires =
          data.numberOfSeats - booking.numberOfSeats;

        if (
          placesSupplementaires > 0 &&
          trip!.availableSeats < placesSupplementaires
        ) {
          return response.badRequest({
            message: `Seulement ${trip!.availableSeats} places supplémentaires disponibles`,
          });
        }

        // Recalculer le montant total
        booking.totalAmount = trip!.pricePerSeat * data.numberOfSeats;
      }

      await booking.merge(data).save();

      // Mettre à jour les places disponibles
      const trip = await Trip.find(booking.tripId);
      await trip!.updateAvailableSeats();

      // Réoptimiser si nécessaire
      if (data.numberOfSeats) {
        try {
          await this.optimizationService.reoptimizeTrip(booking.tripId);
        } catch (error) {
          console.error("Erreur lors de l'optimisation:", error);
        }
      }

      return response.ok({
        message: "Réservation mise à jour avec succès",
        booking,
      });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors de la mise à jour de la réservation",
        error: error.message,
      });
    }
  }

  /**
   * Annuler une réservation
   */
  async cancelBooking({ params, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      const bookingUuid = params.uuid;

      const booking = await Booking.query()
        .where("uuid", bookingUuid)
        .where("passengerId", user.id)
        .whereNotIn("status", ["CANCELLED", "COMPLETED"])
        .firstOrFail();

      // Vérifier que le trajet n'est pas déjà en cours
      const trip = await Trip.find(booking.tripId);
      if (trip!.status === "IN_PROGRESS" || trip!.status === "COMPLETED") {
        return response.badRequest({
          message:
            "Impossible d'annuler une réservation pour un trajet en cours ou terminé",
        });
      }

      // Annuler la réservation
      await booking.merge({ status: "CANCELLED" }).save();

      // Mettre à jour les places disponibles
      await trip!.updateAvailableSeats();

      // Réoptimiser le trajet sans cette réservation
      try {
        await this.optimizationService.reoptimizeTrip(trip!.id);
      } catch (error) {
        console.error("Erreur lors de l'optimisation:", error);
      }

      return response.ok({
        message: "Réservation annulée avec succès",
      });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors de l'annulation de la réservation",
        error: error.message,
      });
    }
  }

  /**
   * Confirmer une réservation (conducteur)
   */
  async confirmBooking({ params, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      const bookingUuid = params.uuid;

      // Vérifier que la réservation appartient à un trajet du conducteur
      const booking = await Booking.query()
        .where("uuid", bookingUuid)
        .whereHas("trip", (query) => {
          query.where("driverId", user.id);
        })
        .where("status", "PENDING")
        .firstOrFail();

      await booking.merge({ status: "CONFIRMED" }).save();

      // Réoptimiser le trajet
      try {
        await this.optimizationService.reoptimizeTrip(booking.tripId);
      } catch (error) {
        console.error("Erreur lors de l'optimisation:", error);
      }

      return response.ok({
        message: "Réservation confirmée avec succès",
      });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors de la confirmation de la réservation",
        error: error.message,
      });
    }
  }

  /**
   * Rejeter une réservation (conducteur)
   */
  async rejectBooking({ params, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      const bookingUuid = params.uuid;

      // Vérifier que la réservation appartient à un trajet du conducteur
      const booking = await Booking.query()
        .where("uuid", bookingUuid)
        .whereHas("trip", (query) => {
          query.where("driverId", user.id);
        })
        .where("status", "PENDING")
        .firstOrFail();

      await booking.merge({ status: "CANCELLED" }).save();

      // Mettre à jour les places disponibles
      const trip = await Trip.find(booking.tripId);
      await trip!.updateAvailableSeats();

      return response.ok({
        message: "Réservation rejetée avec succès",
      });
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors du rejet de la réservation",
        error: error.message,
      });
    }
  }
}
