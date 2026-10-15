// Shown while a 3D scene downloads. It sits behind the canvas (negative z-index inside an
// `isolate` parent), so the scene simply draws over it; the parent removes it once the scene is ready.
export function SceneSpinner() {
  return (
    <div role="status" className="pointer-events-none absolute inset-0 -z-10 flex flex-col items-center justify-center gap-3">
      <span aria-hidden className="spinner" />
      <span className="label text-text-muted">Loading</span>
    </div>
  );
}
