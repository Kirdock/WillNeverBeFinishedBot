<template>
<div class="dropdown">
    <input class="form-control" type="text" v-model="selection"
        @keydown.enter="enter"
        @keydown.down="down"
        @keydown.up="up"
        @input="change"
        @focus="show"
    />
    <div class="dropdown-menu" v-show="matches.length > 0" :class="focus ? 'show' : ''">
        <a v-for="(suggestion,$index) in matches"
            :class="{'active': isActive($index)}"
            @mouseover="current = $index"
            @click.prevent="selectItem($index)"
            class="dropdown-item"
            :key="suggestion"
            href="#"
        >
            {{ suggestion }}
        </a>
    </div>
</div>
</template>

<script>
export default {
    data() {
        return {
            current: 0,
            focus: false
        }
    },
    props: {
        suggestions: {
            type: Array,
            required: true
        },
        selection: {
            type: String,
            required: true
        },
        item_key: {
            type: String,
            required: true
        }
    },
    computed: {
        matches() {
            return this.suggestions.map(suggestion => suggestion[this.item_key]).filter((str) => {
                return str.toLowerCase().indexOf((this.selection ? this.selection.toLowerCase() : '')) > -1;
            });
        }
    },
    methods: {
        enter() {
            this.selection = this.matches[this.current];
            this.updateValue();
        },
        up() {
            if(this.current > 0)
                this.current--;
        },
        down() {
            if(this.current < this.matches.length - 1)
                this.current++;
        },
        isActive(index) {
            return index === this.current;
        },
        change() {
            this.current = 0;
            this.updateValue();
        },
        show(){
            this.current = 0;
            this.focus = true;
            window.addEventListener('click', this.close);
            if(!this.selection){
                this.selection = '';
                this.updateValue();
            }
        },
        selectItem(index) {
            this.selection = this.matches[index];
            this.focus = false;
            this.updateValue();
        },
        updateValue(){
            this.$emit('update:selection', this.selection);
        },
        close(e){
            if (!this.focus || !this.$el.contains(e.target)) {
                this.focus = false;
                window.removeEventListener('click', this.close);
            }
        }
    }
}
</script>