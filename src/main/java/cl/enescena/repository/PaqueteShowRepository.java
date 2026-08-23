package cl.enescena.repository;

import cl.enescena.model.PaqueteShow;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaqueteShowRepository
        extends JpaRepository<PaqueteShow, Long> {
}