<template>
<div>
  <nav class="app-header navbar navbar-expand-sm navbar-light bg-white border-bottom">
    <a id="logo" class="navbar-brand">
     <!--<img src="@/imgs/logo.png">-->
      <span class="vis">Vis</span>
      <span class="flow">Flow</span>
    </a>
    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
    <b-collapse is-nav id="nav-collapse">

        <dataset-bar></dataset-bar>

        <user-bar></user-bar>
      </b-navbar-nav>
    </b-collapse>
  </nav>
</div>

</template>

<style scoped lang="scss" src="./app-header.scss"></style>

<script lang="ts" src="./app-header.ts">
</script>
