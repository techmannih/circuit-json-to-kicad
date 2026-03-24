import { expect, test } from "bun:test"
import { CircuitJsonToKicadPcbConverter } from "lib/pcb/CircuitJsonToKicadPcbConverter"
import circuitJson from "tests/assets/non-plated-hole-circuit.json"

test("pcb_hole placement follows pcb_component_id in kicad_pcb", () => {
  const convertedCircuitJson = structuredClone(circuitJson) as any[]

  const componentHole = convertedCircuitJson.find(
    (entry) => entry.type === "pcb_hole" && entry.pcb_hole_id === "pcb_hole_0",
  )
  componentHole.pcb_component_id = "pcb_component_0"

  const converter = new CircuitJsonToKicadPcbConverter(convertedCircuitJson as any)
  converter.runUntilFinished()

  const output = converter.getOutput()
  const outputString = converter.getOutputString()
  const [resistorFootprint, capacitorFootprint] = output.footprints

  expect(output.footprints).toHaveLength(3)

  expect(resistorFootprint?.libraryLink).toBe("tscircuit:resistor_0402")
  expect(resistorFootprint?.fpPads).toHaveLength(3)
  expect(
    resistorFootprint?.fpPads.some(
      (pad) =>
        pad.padType === "np_thru_hole" &&
        pad.at?.x === -20 &&
        pad.at?.y === 20,
    ),
  ).toBe(true)

  expect(capacitorFootprint?.libraryLink).toBe("tscircuit:capacitor_0402")
  expect(capacitorFootprint?.fpPads).toHaveLength(2)

  const boardHoleFootprint = output.footprints.find(
    (footprint) => footprint.libraryLink === "tscircuit:board_hole",
  )
  expect(boardHoleFootprint).toBeDefined()
  expect(boardHoleFootprint?.fpPads).toHaveLength(1)
  expect(boardHoleFootprint?.fpPads[0]?.padType).toBe("np_thru_hole")
  expect(boardHoleFootprint?.fpPads[0]?.at?.x).toBe(0)
  expect(boardHoleFootprint?.fpPads[0]?.at?.y).toBe(0)
  expect(outputString).toContain('"tscircuit:board_hole"')
  expect(outputString).toContain("(at 120 80 0)")
})
