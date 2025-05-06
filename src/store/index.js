import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    articleOptimizer: {
      inputText: '',
      outputText: '',
      highlightedOutput: '',
      errorMessage: ''
    }
  },
  getters: {
    getArticleOptimizerState: state => state.articleOptimizer
  },
  mutations: {
    setArticleOptimizerInput(state, text) {
      state.articleOptimizer.inputText = text;
    },
    setArticleOptimizerOutput(state, { output, highlighted, error }) {
      state.articleOptimizer.outputText = output;
      state.articleOptimizer.highlightedOutput = highlighted;
      state.articleOptimizer.errorMessage = error || '';
    },
    clearArticleOptimizer(state) {
      state.articleOptimizer.inputText = '';
      state.articleOptimizer.outputText = '';
      state.articleOptimizer.highlightedOutput = '';
      state.articleOptimizer.errorMessage = '';
    }
  },
  actions: {
  },
  modules: {
  }
})
