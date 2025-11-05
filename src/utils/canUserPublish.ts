import { Vehicle } from "../models/Vehicle";
import { User } from "../models/User";
import { Package } from "../models/Package";

export const canUserPublish = async (userId: string): Promise<boolean> => {
  try {
    // Obtener el usuario
    const user = await User.findById(userId);
    if (!user) throw new Error("Usuario no encontrado");

    // Verificar si tiene un paquete asignado
    if (!user.packageType) throw new Error("User has no package assigned");

    // Obtener el paquete y su límite de publicaciones
    const userPackage = await Package.findOne({ type: user.packageType });
    if (!userPackage) throw new Error("Package not found");

    // Contar vehículos publicados por el usuario
    const userVehiclesCount = await Vehicle.countDocuments({ seller: userId });

    // Comparar con el límite del paquete
    return userVehiclesCount < userPackage.maxListings;
  } catch (error) {
    console.error(error);
    return false;
  }
};
