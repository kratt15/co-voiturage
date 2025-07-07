import type { HttpContext } from "@adonisjs/core/http";
import {
  createVehicleValidator,
  updateVehicleValidator,
} from "#validators/vehicle";
import Vehicle from "#models/vehicle";
import db from "@adonisjs/lucid/services/db";

export default class VehiclesController {
  async createVehicle({ response, request, auth }: HttpContext) {
    try {
      const result = await db.transaction(async (trx) => {
        const vehicle = await request.validateUsing(createVehicleValidator);
        const newVehicle = await Vehicle.create(
          {
            ...vehicle,
            driverId: auth.user?.id,
          },
          { client: trx },
        );
        return { newVehicle };
      });
      const newVehicle = result.newVehicle;
      return response.json(newVehicle);
    } catch (error) {
      return response
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  async updateVehicle({ response, request, auth }: HttpContext) {
    try {
      const { uuid } = request.params();
      const vehicle = await request.validateUsing(updateVehicleValidator);
      const foundVehicle = await Vehicle.findBy("uuid", uuid);
      if (!foundVehicle) {
        return response.status(404).json({ message: "Vehicle not found" });
      }

      const result = await db.transaction(async (trx) => {
        foundVehicle.merge({
          ...vehicle,
          driverId: auth.user?.id,
        });
        await foundVehicle.useTransaction(trx).save();
        return { updatedVehicle: foundVehicle };
      });
      const updatedVehicle = result.updatedVehicle;
      return response.json(updatedVehicle);
    } catch (error) {
      return response
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  async deleteVehicle({ response, request }: HttpContext) {
    try {
      const { uuid } = request.params();
      const deletedVehicle = await Vehicle.findBy("uuid", uuid);
      if (!deletedVehicle) {
        return response.status(404).json({ message: "Vehicle not found" });
      }
      await deletedVehicle.delete();
      return response.json({ message: "Vehicle deleted successfully" });
    } catch (error) {
      return response
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  async getAllVehicles({ response }: HttpContext) {
    try {
      const vehicles = await Vehicle.query().preload("driver", (query) => {
        query.select("uuid");
      });
      const transformedVehicles = vehicles.map((vehicle) => {
        const vehicleData = vehicle.toJSON();
        if (vehicleData.id) {
          delete vehicleData.id;
        }
        if (vehicleData.driver) {
          delete vehicleData.driver.id;
        }
        if (vehicleData.driverId) {
          delete vehicleData.driverId;
        }
        return vehicleData;
      });
      return response.json(transformedVehicles);
    } catch (error) {
      return response
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  async showVehicle({ response, request }: HttpContext) {
    try {
      const { uuid } = request.params();
      const vehicle = await Vehicle.findBy("uuid", uuid);
      await vehicle?.load("driver", (query) => {
        query.select("uuid");
      });
      if (!vehicle) {
        return response.status(404).json({ message: "Vehicle not found" });
      }
      // Transformer les données pour masquer l'id du driver
      const vehicleData = vehicle.toJSON();
      if (vehicleData.driver) {
        delete vehicleData.driver.id;
      }
      if (vehicleData.id) {
        delete vehicleData.id;
      }
      if (vehicleData.driverId) {
        delete vehicleData.driverId;
      }

      return response.json(vehicleData);
    } catch (error) {
      return response
        .status(500)
        .json({ message: "Internal server error", error: error });
    }
  }
}
