package cl.uchile.cc5002.tarea4.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "nota")
public class Nota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "avistamiento_id", nullable = false)
    private Integer avistamientoId;

    @Column(name = "nota", nullable = false)
    private Integer nota;

    protected Nota() {
    }

    public Nota(Integer avistamientoId, Integer nota) {
        this.avistamientoId = avistamientoId;
        this.nota = nota;
    }

    public Integer getId() {
        return id;
    }

    public Integer getAvistamientoId() {
        return avistamientoId;
    }

    public Integer getNota() {
        return nota;
    }
}
