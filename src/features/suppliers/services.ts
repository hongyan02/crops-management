import { API_SERVICE } from "@/config/api";
import { get, getWithMeta, post, put } from "@/lib/request";

import type {
  Supplier,
  SupplierQualityBatchInput,
  SupplierFormValues,
  SupplierListParams,
  SupplierProduct,
  SupplierQualityRecord,
} from "./types";

export async function listSuppliers(params: SupplierListParams = {}) {
  return getWithMeta<Supplier[]>(API_SERVICE.suppliers.list, { params });
}

export async function createSupplier(input: SupplierFormValues) {
  return post<Supplier, SupplierFormValues>(API_SERVICE.suppliers.list, input);
}

export async function updateSupplier(id: number, input: SupplierFormValues) {
  return put<Supplier, SupplierFormValues>(API_SERVICE.suppliers.detail(id), input);
}

export async function listSupplierProducts(supplierId: number) {
  return get<SupplierProduct[]>(API_SERVICE.suppliers.products(supplierId));
}

export async function updateSupplierProducts(supplierId: number, productIds: number[]) {
  return put<SupplierProduct[], { productIds: number[] }>(
    API_SERVICE.suppliers.products(supplierId),
    { productIds },
  );
}

export async function listSupplierQuality(supplierId: number, productId: number) {
  return get<SupplierQualityRecord[]>(API_SERVICE.suppliers.quality(supplierId, productId));
}

export async function createSupplierQuality(
  supplierId: number,
  productId: number,
  input: SupplierQualityBatchInput,
) {
  return post<SupplierQualityRecord[], SupplierQualityBatchInput>(
    API_SERVICE.suppliers.quality(supplierId, productId),
    input,
  );
}
