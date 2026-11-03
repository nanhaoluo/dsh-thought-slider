// Pointer travel is between the centers of the track's two 12px endcaps.
export async function travelBox(locator) {
  const box = await locator.boundingBox();
  return { ...box, x: box.x + 12, width: box.width - 24 };
}
