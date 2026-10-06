"use server";

import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";

/**
 * Genera una URL firmada (SAS Token) para subir un archivo directamente a Azure Blob Storage.
 * Expira en 10 minutos y solo tiene permisos de escritura ('w').
 */
export async function generateUploadUrl(fileName: string) {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

  if (!accountName || !accountKey || !containerName) {
    throw new Error("Faltan variables de entorno de Azure Storage.");
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(
    `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`
  );

  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlockBlobClient(fileName);

  // Fecha de expiración (10 minutos)
  const expiresOn = new Date();
  expiresOn.setMinutes(expiresOn.getMinutes() + 10);

  // Generar el SAS Token
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: fileName,
      permissions: BlobSASPermissions.parse("w"), // Solo escritura
      expiresOn,
    },
    blobServiceClient.credential as any
  ).toString();

  // La URL pública base (sin el token) para pasársela al backend después
  const publicUrl = blobClient.url;

  // La URL completa para el fetch PUT desde el frontend
  const uploadUrl = `${publicUrl}?${sasToken}`;

  return { uploadUrl, publicUrl };
}
