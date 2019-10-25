<template>
<div class="dropdown" >
    <input class="form-control" type="text" v-model="selection" id="dropdownMenuLink" aria-haspopup="true" data-toggle="dropdown" aria-expanded="false"
        @keydown.enter="enter"
        @keydown.down="down"
        @keydown.up="up"
        @input="change"
        @focus="show"
        @blur="hide"
    />
    <div class="dropdown-menu"  aria-labelledby="dropdownMenuLink" v-show="matches.length > 0">
        <a v-for="(suggestion,$index) in matches"
            :class="{'active': isActive($index)}"
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
            if(!this.selection){
                this.selection = '';
                this.updateValue();
            }
        },
        hide(){
            this.focus = false;
        },
        selectItem(index) {
            this.selection = this.matches[index];
            this.updateValue();
        },
        updateValue(){
            this.$emit('update:selection', this.selection);
        }
    }
}
</script>