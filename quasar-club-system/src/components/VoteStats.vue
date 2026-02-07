<template>
  <div class="row items-center justify-center q-gutter-sm q-mt-sm">

    <q-chip color="grey-2" text-color="black" class="q-pa-sm">
      <span class="text-weight-medium">Votes: {{ survey.votes.length }}</span>
    </q-chip>

    <q-chip color="green-3" text-color="black" class="q-pa-sm">
      👍 {{ countPositiveVotes(survey.votes) }}
    </q-chip>

    <q-chip color="red-3" text-color="black" class="q-pa-sm">
      👎 {{ countNegativeVotes(survey.votes) }}
    </q-chip>

  </div>
</template>

<script setup>
import { countPositiveVotes, countNegativeVotes } from '@/utils/voteUtils'

defineProps({
  survey: {
    type: Object,
    required: true
  }
})
</script>
