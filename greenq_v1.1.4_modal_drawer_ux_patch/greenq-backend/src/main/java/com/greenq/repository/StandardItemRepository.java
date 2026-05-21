package com.greenq.repository;

import com.greenq.entity.StandardItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StandardItemRepository extends JpaRepository<StandardItem, Long> {
}
