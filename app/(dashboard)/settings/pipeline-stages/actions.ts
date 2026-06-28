"use server";

import { revalidatePath } from "next/cache";
import {
  createPipelineStage,
  deletePipelineStage,
  listPipelineStages,
  updatePipelineStage,
} from "@/services/pipeline-stages.service";

export async function createPipelineStageAction(name: string): Promise<void> {
  const stages = await listPipelineStages();
  const nextOrder = (stages.at(-1)?.order_index ?? 0) + 1;
  await createPipelineStage({ name, order_index: nextOrder, is_won: false, is_lost: false });
  revalidatePath("/settings/pipeline-stages");
}

export async function deletePipelineStageAction(id: string): Promise<void> {
  await deletePipelineStage(id);
  revalidatePath("/settings/pipeline-stages");
}

export async function moveStageAction(id: string, direction: "up" | "down"): Promise<void> {
  const stages = await listPipelineStages();
  const index = stages.findIndex((s) => s.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= stages.length) return;

  const current = stages[index];
  const neighbor = stages[swapIndex];
  await Promise.all([
    updatePipelineStage(current.id, { order_index: neighbor.order_index }),
    updatePipelineStage(neighbor.id, { order_index: current.order_index }),
  ]);
  revalidatePath("/settings/pipeline-stages");
  revalidatePath("/crm/pipeline");
}
