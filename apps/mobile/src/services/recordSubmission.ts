import type * as ImagePicker from "expo-image-picker";
import type { RecordType } from "@pee-poo/shared";
import { api } from "./api";

export async function createRecordWithPhoto(params: {
	type: RecordType;
	fields: Record<string, unknown>;
	photo: ImagePicker.ImagePickerAsset | null;
}) {
	const { record, photoUploadUrl, photoStoragePath } = await api.createRecord({
		type: params.type,
		recordedAt: new Date().toISOString(),
		...params.fields,
	});

	if (params.photo && photoUploadUrl && photoStoragePath) {
		const blob = await (await fetch(params.photo.uri)).blob();
		const putRes = await fetch(photoUploadUrl, {
			method: "PUT",
			headers: { "Content-Type": params.photo.mimeType ?? "image/jpeg" },
			body: blob,
		});
		if (!putRes.ok) {
			throw new Error("相片上載失敗");
		}
		await api.confirmPhoto(record.id, {
			storagePath: photoStoragePath,
			contentType: params.photo.mimeType ?? "image/jpeg",
			sizeBytes: params.photo.fileSize ?? 0,
		});
	}

	return record;
}
