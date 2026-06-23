<script setup lang="js" name="PasswordInput">
import { ref } from 'vue'

defineProps({
  id: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '请输入密码',
  },
  modelValue: {
    type: String,
    default: '',
  },
  invalid: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'blur'])

const visible = ref(false)

function toggleVisible() {
  visible.value = !visible.value
}

function onInput(event) {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div class="password-field">
    <input
        :id="id"
        class="password-input"
        :class="{ 'input-invalid': invalid }"
        :type="visible ? 'text' : 'password'"
        :placeholder="placeholder"
        autocomplete="off"
        :value="modelValue"
        @input="onInput"
        @blur="emit('blur')"
    />
    <button
        type="button"
        class="password-toggle"
        :aria-label="visible ? '隐藏密码' : '显示密码'"
        @click="toggleVisible"
    >
      {{ visible ? '隐藏' : '显示' }}
    </button>
  </div>
</template>

<style scoped>
.password-field {
  position: relative;
  width: 100%;
  max-width: 490px;
}

.password-input {
  height: 60px;
  width: 100%;
  padding: 4px 56px 4px 15px;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 7px;
  font-size: 17px;
  box-sizing: border-box;
}

.password-input.input-invalid {
  border-color: #f56c6c;
}

.password-input::placeholder {
  color: rgb(192, 196, 207);
  font-size: 17px;
}

.password-input:focus {
  outline: none;
  border-color: rgb(72, 138, 248);
}

.password-input.input-invalid:focus {
  border-color: #f56c6c;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: rgb(72, 138, 248);
  cursor: pointer;
  font-size: 15px;
  padding: 4px 6px;
  line-height: 1;
}

.password-toggle:hover {
  color: rgb(104, 157, 246);
}
</style>
