import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Sem isto, qualquer throw de render (ex.: react-markdown recebendo saída adversarial
// do LLM, ou uma falha inesperada de storage) derruba a árvore inteira para uma tela
// branca — inclusive quando essa árvore é o widget rodando dentro do iframe de um
// site integrador de terceiros.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro não tratado na interface:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "1rem", fontFamily: "system-ui, sans-serif" }}>
          <p>Algo deu errado ao carregar esta página. Tente recarregar.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
