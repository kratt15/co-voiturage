import type { HttpContext } from "@adonisjs/core/http";
import User from "#models/user";
import Trip from "#models/trip";
import {
  updatePasswordValidator,
  updateProfileValidator,
} from "#validators/user";
import { DateTime } from "luxon";
import hash from "@adonisjs/core/services/hash";

export default class UsersController {
  async getUser({ response, request }: HttpContext) {
    try {
      const { uuid } = request.params();
      const user = await User.findBy("uuid", uuid);
      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }
      return response.json(user);
    } catch (error) {
      return response
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  async profile({ response, auth }: HttpContext) {
    try {
      // Récupérer l'utilisateur connecté
      const user = auth.getUserOrFail();
      await user.load("vehicles");

      // Récupérer les statistiques du profil
      const stats = {
        tripAsDriver: await Trip.query()
          .where("driver_id", user.id)
          .count("* as total"),
        tripAsPassenger: await Trip.query()
          .where("passenger_id", user.id)
          .whereIn("status", ["COMPLETED", "CANCELLED"])
          .count("* as total"),
      };

      return response.ok({
        user,
        stats,
      });
    } catch (error) {
      return response
        .status(500)
        .json({ message: "Error fetching user profile", error: error.message });
    }
  }

  async updateProfile({ response, auth, request }: HttpContext) {
    try {
      // Récupérer l'utilisateur connecté
      const user = auth.getUserOrFail();

      // Valider les données
      const {
        firstName,
        lastName,
        email,
        phone,
        birthDate,
        photo,
        drivingLicense,
        licenseObtentionDate,
        drivingExperience,
        globalRating,
      } = await request.validateUsing(updateProfileValidator);

      // Mettre à jour les données
      user.firstName = firstName ?? user.firstName;
      user.lastName = lastName ?? user.lastName;
      user.email = email ?? user.email;
      user.phone = phone ?? user.phone;
      user.birthDate = birthDate
        ? DateTime.fromJSDate(birthDate)
        : user.birthDate;
      // TODO : Gérer l'upload de photo
      user.photo = photo ?? user.photo;
      user.drivingLicense = drivingLicense ?? user.drivingLicense;
      user.licenseObtentionDate = licenseObtentionDate
        ? DateTime.fromJSDate(licenseObtentionDate)
        : user.licenseObtentionDate;
      user.drivingExperience = drivingExperience ?? user.drivingExperience;
      user.globalRating = globalRating ?? user.globalRating;

      await user.save();

      return response.ok({
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      return response
        .status(422)
        .json({ message: "Invalid data", errors: error.messages });
    }
  }

  async updatePassword({ response, auth, request }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      const { oldPassword, password } = await request.validateUsing(
        updatePasswordValidator,
      );

      // Vérifier l'ancien mot de passe
      if (!(await hash.verify(user.password, oldPassword))) {
        return response.status(401).json({ message: "Invalid old password" });
      }

      // Mettre à jour le mot de passe
      user.password = await hash.make(password);
      await user.save();

      return response.ok({
        message: "Password updated successfully",
      });
    } catch (error) {
      return response
        .status(422)
        .json({ message: "Invalid data", errors: error.messages });
    }
  }

  async userTrips({ response, params, request }: HttpContext) {
    try {
      // Récupérer les paramètres de la requête
      const { uuid } = params;
      const { page = 1, limit = 20 } = request.qs();

      // Récupérer l'utilisateur
      const user = await User.findByOrFail("uuid", uuid);

      // Récupérer les trajets de l'utilisateur
      const trips = await Trip.query()
        .where("driver_id", user.id)
        .whereIn("status", ["PUBLISHED", "COMPLETED", "CANCELLED"])
        .preload("vehicle")
        .orderBy("departureDate", "asc")
        .paginate(page, limit);

      return response.ok(trips);
    } catch (error) {
      return response.status(500).json({
        message: "Error fetching trips",
        error: error.message,
      });
    }
  }

  async deleteAccount({ response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail();

      // Supprimer l'utilisateur
      await user.delete();

      return response.ok({
        message: "Account deleted successfully",
      });
    } catch (error) {
      return response
        .status(500)
        .json({ message: "Error deleting account", error: error.message });
    }
  }
}
