<template>
  <q-card flat bordered class="bg-grey-1 q-mb-lg">
    <q-card-section class="bg-orange text-white">
      <div class="text-h6">
        <q-icon name="person_add" class="q-mr-sm" />
        {{ $t('team.single.invite.title') }}
      </div>
    </q-card-section>

    <q-card-section class="q-pa-md">
      <div class="text-body2 text-grey-7 q-mb-md">
        {{ $t('team.single.invite.description') }}
      </div>

      <!-- Invite Form -->
      <q-form @submit="handleSendInvitation" class="q-gutter-md">
        <q-input
          :model-value="props.inviteForm.email"
          @update:model-value="updateEmail"
          type="email"
          :label="$t('team.single.invite.email')"
          outlined
          dense
          :rules="[
                    val => !!val || $t('team.single.invite.emailRequired'),
                    val => /.+@.+\..+/.test(val) || $t('team.single.invite.emailInvalid')
                  ]"
        >
          <template v-slot:prepend>
            <q-icon name="email" />
          </template>
        </q-input>

        <q-input
          :model-value="props.inviteForm.message"
          @update:model-value="updateMessage"
          type="textarea"
          :label="$t('team.single.invite.message')"
          outlined
          dense
          rows="3"
          :placeholder="$t('team.single.invite.messagePlaceholder')"
        >
          <template v-slot:prepend>
            <q-icon name="message" />
          </template>
        </q-input>

        <div class="row justify-end">
          <q-btn
            type="submit"
            color="orange"
            icon="send"
            :label="$t('team.single.invite.send')"
            :loading="props.sendingInvite"
          />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup>
const props = defineProps({
  inviteForm: {
    type: Object,
    required: true,
    default: () => ({ email: '', message: '' })
  },
  sendingInvite: {
    type: Boolean,
    required: true,
    default: false
  }
})

const emit = defineEmits([
  'sendInvitation',
  'updateEmail',
  'updateMessage'
])

const handleSendInvitation = () => {
  emit('sendInvitation')
}

const updateEmail = (value) => {
  emit('updateEmail', value)
}

const updateMessage = (value) => {
  emit('updateMessage', value)
}
</script>

<style scoped>

</style>
