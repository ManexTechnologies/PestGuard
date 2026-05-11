# TODO - Pest scanning AI/models

- [x] Disable pest identification call from frontend (PestScanner.tsx) while keeping UI/button.
- [x] Disable backend pestid inference bridge (backend/api/pestid.php) to never call FastAPI/PyTorch.
- [x] Update response/UI copy to clearly state scanning is disabled/unavailable.
- [x] Quick sanity check: run `npm run lint` and `npm run build`.

- [ ] Convert `pest_data/models/best_pest_model.h5` -> TensorFlow.js GraphModel files
- [ ] Place converted files under `public/models/pest_model/saved_model/`
- [ ] Add `public/models/pest_model/metadata.json` with `classes` list
- [ ] Rewire `PestScanner.tsx` to run local identification via `identifyPestLocally`
- [ ] Re-enable the loading/error handling UI for real predictions

