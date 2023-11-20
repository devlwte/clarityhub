class InfiniteScroll {
  constructor(containerElement, dataArray, itemsPerPage, objelement, template) {
    this.containerElement = containerElement;
    this.dataArray = dataArray;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.currentNum = 0;
    this.isLoading = false;
    this.lastScrollTop = 0;
    this.objelement = objelement;
    this.template = template;

    // Agregar un evento de scroll al elemento contenedor deseado utilizando jQuery.
    $(containerElement).on("scroll", () => {
      if (!this.isLoading && this.isAtBottom() && this.isScrollingDown()) {
        this.loadMoreItems();
      }
    });

    // Cargar los primeros elementos al iniciar la página.
    this.loadMoreItems();
  }

  isAtBottom() {
    const container = this.containerElement;
    return (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 20 // Ajustar este valor según tus necesidades
    );
  }

  isScrollingDown() {
    const container = this.containerElement;
    const scrollTop = container.scrollTop;
    const isScrollingDown = scrollTop > this.lastScrollTop;
    this.lastScrollTop = scrollTop;
    return isScrollingDown;
  }

  async loadMoreItems() {
    this.isLoading = true;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const newItems = this.dataArray.slice(startIndex, endIndex);

    if (newItems.length > 0) {
      this.currentPage++;
      // Aquí puedes hacer lo que necesites con los nuevos elementos, como mostrarlos en la página.
      await this.renderItems(newItems);
    } else {
      // console.log("Ya no hay más elementos para cargar.");
    }

    this.isLoading = false;
  }

  async renderItems(items) {
    // Implementa la lógica para mostrar los elementos en tu página con animación uno por uno.

    const existingItemCount = $(this.objelement).children().length;
    let animationDelay = 0; // Retraso de animación para los nuevos elementos.

    for (const item of items) {
      this.currentNum++;
      const newItem = await this.template(item, this.currentNum);

      // Crear un elemento jQuery a partir de la plantilla y ocultarlo inicialmente.
      const $newItem = $(newItem).css({ opacity: 0, marginLeft: '-20px' });

      // Agregar el nuevo elemento al final del contenedor.
      $(this.objelement).append($newItem);

      // Aplicar una animación personalizada para mostrar el elemento con retardo.
      $newItem.delay(animationDelay).animate({ opacity: 1, marginLeft: '0' }, 500); // Ajusta los valores y la duración según tus necesidades.

      // Incrementar el retraso de animación para el siguiente elemento.
      animationDelay += 100; // Puedes ajustar el valor según tus necesidades.
    }
  }
}
