<template>
  <div class="row items-center justify-center q-gutter-sm q-mt-sm">

    <q-chip color="grey-2" text-color="black" class="q-pa-sm">
      <span class="text-weight-medium">Votes: {{ survey.votes.length }}</span>
    </q-chip>

    <q-chip color="green-3" text-color="black" class="q-pa-sm">
      👍 {{ teamStore.getPositiveVotes(survey.id) }}
    </q-chip>

    <q-chip color="red-3" text-color="black" class="q-pa-sm">
      👎 {{ teamStore.getNegativeVotes(survey.id) }}
    </q-chip>

  </div>
</template>

<script setup>
import { useTeamStore } from '@/stores/teamStore'
const teamStore = useTeamStore()

defineProps({
  survey: {
    type: Object,
    required: true
  }
})
</script>
