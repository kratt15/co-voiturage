// import type { HttpContext } from '@adonisjs/core/http'
import { createVehicleValidator, updateVehicleValidator } from "#validators/vehicle"
import { Request, Response } from "@adonisjs/core/http"
import Vehicle from "#models/vehicle"

export default class VehiclesController {

    async createVehicle(request: Request, response: Response) {
      try {
        const vehicle = await request.validateUsing(createVehicleValidator)
        const newVehicle = await Vehicle.create(vehicle)
        return response.json(newVehicle)
      } catch (error) {
        return response.status(500).json({ message: 'Internal server error' , error: error})
      }
    }

    async updateVehicle(request: Request, response: Response) {
        try {
            const {id} = request.params()
            const vehicle = await request.validateUsing(updateVehicleValidator)
            const updatedVehicle = await Vehicle.findBy('id', id)
            if (!updatedVehicle) {
                return response.status(404).json({ message: 'Vehicle not found' })
            }
            updatedVehicle.merge(vehicle)
            await updatedVehicle.save()
            return response.json(updatedVehicle)
        } catch (error) {
            return response.status(500).json({ message: 'Internal server error' , error: error})
        }
    }

    async deleteVehicle(request: Request, response: Response) {
        try {
            const {id} = request.params()
            const deletedVehicle = await Vehicle.findBy('id', id)
            if (!deletedVehicle) {
                return response.status(404).json({ message: 'Vehicle not found' })
            }
            await deletedVehicle.delete()
            return response.json({ message: 'Vehicle deleted successfully' })
        } catch (error) {
            return response.status(500).json({ message: 'Internal server error' })
        }
    }

    async getAllVehicles(response: Response) {
        try {
            const vehicles = await Vehicle.all()
            return response.json(vehicles)
        } catch (error) {
            return response.status(500).json({ message: 'Internal server error' , error: error})
        }
    }
    async showVehicle(request: Request, response: Response) {
        try {
            const {id} = request.params()
            const vehicle = await Vehicle.findBy('id', id)
            if (!vehicle) {
                return response.status(404).json({ message: 'Vehicle not found' })
            }
            return response.json(vehicle)
        } catch (error) {
            return response.status(500).json({ message: 'Internal server error' , error: error})
        }
    }
}