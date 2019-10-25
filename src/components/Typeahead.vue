<template>
<div class="dropdown" style="padding-right: 0px">
    <input class="form-control" type="text" v-model="selection"
        @keydown.enter="enter"
        @keydown.down="down"
        @keydown.up="up"
        @input="change"
        @focus="show"
    />
    <div class="dropdown-menu" v-show="matches.length > 0" :class="open ? 'show' : ''">
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
            open: false
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
            type: String
        }
    },
    watch:{
        selection: function(newVal, oldVal){
            this.$emit('update:selection', newVal);
        }
    },
    computed: {
        matches() {
            return this.suggestions.map(suggestion => {
                return this.item_key ? suggestion[this.item_key] : suggestion;
            }).filter((str) => {
                return str.toLowerCase().indexOf((this.selection ? this.selection.toLowerCase() : '')) > -1;
            });
        }
    },
    methods: {
        enter() {
            this.selection = this.matches[this.current];
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
        },
        show(){
            this.current = 0;
            this.open = true;
            window.addEventListener('click', this.close);
            if(!this.selection){
                this.selection = '';
            }
        },
        selectItem(index) {
            this.selection = this.matches[index];
            this.open = false;
        },
        close(e){
            if (!this.open || !this.$el.contains(e.target)) {
                this.open = false;
                window.removeEventListener('click', this.close);
            }
        }
    }
}
</script>