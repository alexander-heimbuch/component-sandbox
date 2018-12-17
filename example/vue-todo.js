export default `
<link rel="stylesheet" href="http://todomvc.com/examples/vue/node_modules/todomvc-common/base.css">
<link rel="stylesheet" href="http://todomvc.com/examples/vue/node_modules/todomvc-app-css/index.css">
<section class="todoapp" v-cloak="">
  <header class="header">
    <h1>todos</h1>
    <input class="new-todo" autofocus="" autocomplete="off" placeholder="What needs to be done?" v-model="newTodo" @keyup.enter="addTodo">
  </header>
  <section class="main" v-show="todos.length">
    <input id="toggle-all" class="toggle-all" type="checkbox" v-model="allDone">
    <label for="toggle-all">Mark all as complete</label>
    <ul class="todo-list">
      <li class="todo" v-for="todo in filteredTodos" :key="todo.id" :class="{completed: todo.completed, editing: todo == editedTodo}">
        <div class="view">
          <input class="toggle" type="checkbox" v-model="todo.completed">
          <label @dblclick="editTodo(todo)">{{todo.title}}</label>
          <button class="destroy" @click="removeTodo(todo)"></button>
        </div>
        <input class="edit" type="text" v-model="todo.title" v-todo-focus="todo == editedTodo" @blur="doneEdit(todo)" @keyup.enter="doneEdit(todo)" @keyup.esc="cancelEdit(todo)">
      </li>
    </ul>
  </section>
  <footer class="footer" v-show="todos.length">
    <span class="todo-count">
      <strong v-text="remaining"></strong> {{pluralize('item', remaining)}} left
    </span>
    <ul class="filters">
      <li><a href="#/all" :class="{selected: visibility == 'all'}">All</a></li>
      <li><a href="#/active" :class="{selected: visibility == 'active'}">Active</a></li>
      <li><a href="#/completed" :class="{selected: visibility == 'completed'}">Completed</a></li>
    </ul>
    <button class="clear-completed" @click="removeCompleted" v-show="todos.length > remaining">
      Clear completed
    </button>
  </footer>
</section>
<script src="http://todomvc.com/examples/vue/node_modules/todomvc-common/base.js" type="text/javascript"></script>
<script src="http://todomvc.com/examples/vue/node_modules/director/build/director.js" type="text/javascript"></script>
<script src="http://todomvc.com/examples/vue/node_modules/vue/dist/vue.js" type="text/javascript"></script>
<script src="http://todomvc.com/examples/vue/js/store.js" type="text/javascript"></script>
<script src="http://todomvc.com/examples/vue/js/app.js" type="text/javascript"></script>
<script src="http://todomvc.com/examples/vue/js/routes.js" type="text/javascript"></script>
`;
